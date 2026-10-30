begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table private.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on private.store_admins from public, anon, authenticated;

create function private.is_store_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.store_admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_store_admin() from public, anon;
grant execute on function private.is_store_admin() to authenticated;

create function public.store_access() returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.is_store_admin();
$$;
revoke all on function public.store_access() from public, anon;
grant execute on function public.store_access() to authenticated;

create function private.valid_product(doc jsonb, product_id text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare image text; option jsonb; option_ids text[] := '{}'; amount numeric;
begin
  if jsonb_typeof(doc) is distinct from 'object' or doc->>'id' is distinct from product_id
    or product_id !~ '^[a-z0-9][a-z0-9-]{0,79}$'
    or jsonb_typeof(doc->'name') is distinct from 'string' or nullif(btrim(doc->>'name'), '') is null or length(doc->>'name') > 150
    or jsonb_typeof(doc->'category') is distinct from 'string' or nullif(btrim(doc->>'category'), '') is null or length(doc->>'category') > 60
    or jsonb_typeof(doc->'description') is distinct from 'string' or length(doc->>'description') > 2000
    or not (doc ? 'priceGhs') or jsonb_typeof(doc->'image') is distinct from 'string' then return false; end if;
  if exists(select 1 from jsonb_each(doc) entry where entry.key in ('imageIsPlaceholder','imageIsReference','requiresPhoto','isSample','priceIsEstimate') and jsonb_typeof(entry.value) <> 'boolean') then return false; end if;
  if exists(select 1 from jsonb_each(doc) entry where entry.key in ('customizationLabel','customizationHint','imageNote') and (jsonb_typeof(entry.value) <> 'string' or length(entry.value #>> '{}') > 2000)) then return false; end if;
  if doc->'priceGhs' <> 'null'::jsonb then
    if jsonb_typeof(doc->'priceGhs') <> 'number' then return false; end if;
    amount := (doc->>'priceGhs')::numeric;
    if amount < 0 or amount > 1000000 or round(amount, 2) <> amount then return false; end if;
  end if;
  if doc ? 'gallery' and doc->'gallery' <> 'null'::jsonb then
    if jsonb_typeof(doc->'gallery') <> 'array' or jsonb_array_length(doc->'gallery') > 1 then return false; end if;
  end if;
  for image in select doc->>'image' union all
    select jsonb_array_elements_text(case when jsonb_typeof(doc->'gallery') = 'array' then doc->'gallery' else '[]'::jsonb end)
  loop
    if image is null or length(image) > 2000 or position('..' in image) > 0
      or not (image ~ '^/products/[a-zA-Z0-9/_.-]+$' or image ~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?(/[^[:space:]]*)?$') then return false; end if;
  end loop;
  if doc ? 'priceOptions' and doc->'priceOptions' <> 'null'::jsonb then
    if jsonb_typeof(doc->'priceOptions') <> 'array' or jsonb_array_length(doc->'priceOptions') <> 2 then return false; end if;
    for option in select jsonb_array_elements(doc->'priceOptions') loop
      if coalesce(option->>'id', '') !~ '^[a-z0-9-]{1,40}$' or option->>'id' = any(option_ids)
        or nullif(btrim(option->>'label'), '') is null or length(option->>'label') > 80
        or jsonb_typeof(option->'priceGhs') is distinct from 'number' then return false; end if;
      amount := (option->>'priceGhs')::numeric;
      if amount < 0 or amount > 1000000 or round(amount, 2) <> amount then return false; end if;
      option_ids := array_append(option_ids, option->>'id');
    end loop;
  end if;
  return true;
exception when others then return false;
end;
$$;
revoke all on function private.valid_product(jsonb, text) from public, anon;
grant execute on function private.valid_product(jsonb, text) to authenticated;

create table public.store_products (
  id text primary key,
  details jsonb not null check (private.valid_product(details, id)),
  active boolean not null default true,
  stock_quantity integer check (stock_quantity between 0 and 100000),
  stock_status text not null default 'confirm' check (stock_status in ('confirm','available','unavailable')),
  updated_at timestamptz not null default now()
);
create table public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (length(name) <= 100),
  phone text not null default '' check (phone = '' or phone ~ '^\+?[0-9 ()-]{7,24}$'),
  city text not null default '' check (length(city) <= 100),
  address text not null default '' check (length(address) <= 300),
  landmark text not null default '' check (length(landmark) <= 200),
  updated_at timestamptz not null default now()
);
create table public.customer_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.store_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create table public.store_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('BBR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  request_signature text not null,
  status text not null default 'requested' check (status in ('requested','confirmed','customising','ready','out_for_delivery','delivered','cancelled')),
  items jsonb not null,
  contact jsonb not null,
  subtotal numeric(14,2) not null default 0,
  unpriced_quantity integer not null default 0,
  has_estimate boolean not null default false,
  reserved_stock jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_key)
);
create index store_orders_user_date on public.store_orders(user_id, created_at desc);
create index store_orders_status_date on public.store_orders(status, created_at desc);
create table public.store_order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.store_orders(id) on delete cascade,
  status text not null,
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now()
);
create index store_order_events_order on public.store_order_events(order_id, created_at);

alter table public.store_products enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.customer_favorites enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_order_events enable row level security;

revoke all on public.store_products, public.customer_profiles, public.customer_favorites, public.store_orders, public.store_order_events from public, anon, authenticated;
grant select on public.store_products to anon, authenticated;
grant insert, update on public.store_products to authenticated;
grant select, insert, update on public.customer_profiles to authenticated;
grant select, insert, delete on public.customer_favorites to authenticated;
grant select on public.store_orders, public.store_order_events to authenticated;
create policy products_public_read on public.store_products for select to anon using (active);
create policy products_member_read on public.store_products for select to authenticated using (active or (select private.is_store_admin()));
create policy products_owner_insert on public.store_products for insert to authenticated with check ((select private.is_store_admin()));
create policy products_owner_update on public.store_products for update to authenticated using ((select private.is_store_admin())) with check ((select private.is_store_admin()));
create policy profile_own_read on public.customer_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profile_own_insert on public.customer_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy profile_own_update on public.customer_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy favorites_own_read on public.customer_favorites for select to authenticated using (user_id = (select auth.uid()));
create policy favorites_own_insert on public.customer_favorites for insert to authenticated with check (user_id = (select auth.uid()));
create policy favorites_own_delete on public.customer_favorites for delete to authenticated using (user_id = (select auth.uid()));
create policy orders_private_read on public.store_orders for select to authenticated using (user_id = (select auth.uid()) or (select private.is_store_admin()));
create policy events_private_read on public.store_order_events for select to authenticated using (exists(select 1 from public.store_orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_store_admin()))));

create function private.create_order_request(p_items jsonb, p_request_key uuid) returns public.store_orders
language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid := auth.uid(); existing public.store_orders; result public.store_orders;
  line jsonb; product public.store_products; option jsonb; snapshot jsonb := '[]';
  quantity integer; total_quantity integer; amount numeric; subtotal numeric := 0;
  unpriced integer := 0; estimate boolean := false; profile public.customer_profiles;
  contact jsonb; signature text;
begin
  if account_id is null then raise exception 'Sign in to save an order request.' using errcode = '42501'; end if;
  if p_request_key is null or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 40 or length(p_items::text) > 40000 then raise exception 'Check your shopping bag and try again.'; end if;
  signature := md5(p_items::text);
  perform pg_advisory_xact_lock(hashtextextended(account_id::text || p_request_key::text, 0));
  select * into existing from public.store_orders where user_id = account_id and request_key = p_request_key;
  if found then
    if existing.request_signature <> signature then raise exception 'Your bag changed. Please save a new request.'; end if;
    return existing;
  end if;
  for line in select jsonb_array_elements(p_items) loop
    if jsonb_typeof(line) is distinct from 'object' or jsonb_typeof(line->'quantity') is distinct from 'number'
      or (line->>'quantity')::numeric not between 1 and 99 or trunc((line->>'quantity')::numeric) <> (line->>'quantity')::numeric
      or jsonb_typeof(line->'productId') is distinct from 'string' or jsonb_typeof(line->'customization') is distinct from 'string'
      or length(line->>'customization') > 300 then raise exception 'Check the quantities and customisation details in your bag.'; end if;
  end loop;
  for line in select jsonb_array_elements(p_items) loop
    select * into product from public.store_products where id = line->>'productId' and active;
    if not found or product.stock_status = 'unavailable' or product.stock_quantity = 0 then raise exception 'A product in your bag is unavailable. Please review your bag.'; end if;
    quantity := (line->>'quantity')::integer;
    select sum((item->>'quantity')::integer) into total_quantity from jsonb_array_elements(p_items) item where item->>'productId' = product.id;
    if product.stock_quantity is not null and total_quantity > product.stock_quantity then raise exception 'The requested quantity is no longer available for %. Please reduce it.', product.details->>'name'; end if;
    if line ? 'referenceImage' and line->'referenceImage' <> 'null'::jsonb and not (
      line->>'referenceImage' = product.details->>'image' or coalesce(product.details->'gallery', '[]') ? (line->>'referenceImage')
    ) then raise exception 'Please choose a current product photo.'; end if;
    amount := null; option := null;
    if jsonb_typeof(product.details->'priceOptions') = 'array' then
      select value into option from jsonb_array_elements(product.details->'priceOptions') where value->>'id' = line->>'optionId';
      if option is null then raise exception 'Choose a customisation option for %.', product.details->>'name'; end if;
      amount := (option->>'priceGhs')::numeric;
    else
      if line ? 'optionId' and line->'optionId' <> 'null'::jsonb then raise exception 'This product does not have that price option.'; end if;
      amount := (product.details->>'priceGhs')::numeric;
    end if;
    if amount is null then unpriced := unpriced + quantity; else subtotal := subtotal + amount * quantity; end if;
    estimate := estimate or coalesce((product.details->>'priceIsEstimate')::boolean, false);
    snapshot := snapshot || jsonb_build_array(jsonb_build_object(
      'productId', product.id, 'name', product.details->>'name', 'image', coalesce(nullif(line->>'referenceImage',''), product.details->>'image'),
      'quantity', quantity, 'customization', line->>'customization', 'optionId', option->>'id', 'optionLabel', option->>'label',
      'unitPrice', amount, 'estimated', coalesce((product.details->>'priceIsEstimate')::boolean, false),
      'requiresPhoto', coalesce((product.details->>'requiresPhoto')::boolean, false)
    ));
  end loop;
  select * into profile from public.customer_profiles where user_id = account_id;
  contact := jsonb_build_object('name', coalesce(profile.name, ''), 'phone', coalesce(profile.phone, ''), 'city', coalesce(profile.city, ''), 'address', coalesce(profile.address, ''), 'landmark', coalesce(profile.landmark, ''), 'email', auth.jwt()->>'email');
  insert into public.store_orders(user_id, request_key, request_signature, items, contact, subtotal, unpriced_quantity, has_estimate)
    values(account_id, p_request_key, signature, snapshot, contact, subtotal, unpriced, estimate) returning * into result;
  insert into public.store_order_events(order_id, status, note) values(result.id, 'requested', 'Request saved. Send it on WhatsApp for seller confirmation.');
  return result;
end;
$$;
revoke all on function private.create_order_request(jsonb, uuid) from public, anon;
grant execute on function private.create_order_request(jsonb, uuid) to authenticated;
create function public.create_order_request(p_items jsonb, p_request_key uuid) returns public.store_orders
language sql security invoker set search_path = '' as $$ select private.create_order_request(p_items, p_request_key); $$;
revoke all on function public.create_order_request(jsonb, uuid) from public, anon;
grant execute on function public.create_order_request(jsonb, uuid) to authenticated;

create function private.update_order_status(p_order_id uuid, p_status text, p_note text) returns public.store_orders
language plpgsql security definer set search_path = '' as $$
declare result public.store_orders; allowed text[]; item record; product public.store_products; reserved jsonb := '[]';
begin
  if not private.is_store_admin() then raise exception 'Owner access is required.' using errcode = '42501'; end if;
  if p_note is null or length(p_note) > 500 then raise exception 'Keep the update note under 500 characters.'; end if;
  select * into result from public.store_orders where id = p_order_id for update;
  if not found then raise exception 'Order request not found.'; end if;
  if result.status = p_status then return result; end if;
  allowed := case result.status
    when 'requested' then array['confirmed','cancelled'] when 'confirmed' then array['customising','ready','out_for_delivery','cancelled']
    when 'customising' then array['ready','cancelled'] when 'ready' then array['out_for_delivery','delivered','cancelled']
    when 'out_for_delivery' then array['delivered','cancelled'] else array[]::text[] end;
  if p_status is null or not (p_status = any(allowed)) then raise exception 'That status change is not available.'; end if;
  if result.status = 'requested' and p_status = 'confirmed' then
    for item in select value->>'productId' as id, sum((value->>'quantity')::integer)::integer as quantity from jsonb_array_elements(result.items) group by 1 order by 1 loop
      select * into product from public.store_products where id = item.id for update;
      if not found or not product.active or product.stock_status = 'unavailable' or (product.stock_quantity is not null and product.stock_quantity < item.quantity) then raise exception 'Stock is no longer available for this request.'; end if;
      if product.stock_quantity is not null then
        update public.store_products set stock_quantity = stock_quantity - item.quantity, updated_at = now() where id = item.id;
        reserved := reserved || jsonb_build_array(jsonb_build_object('id', item.id, 'quantity', item.quantity));
      end if;
    end loop;
    result.reserved_stock := reserved;
  end if;
  if p_status = 'cancelled' then
    for item in select value->>'id' as id, (value->>'quantity')::integer as quantity from jsonb_array_elements(result.reserved_stock) order by 1 loop
      update public.store_products set stock_quantity = case when stock_quantity is null then null else stock_quantity + item.quantity end, updated_at = now() where id = item.id;
    end loop;
    result.reserved_stock := '[]';
  end if;
  update public.store_orders set status = p_status, reserved_stock = result.reserved_stock, updated_at = now() where id = result.id returning * into result;
  insert into public.store_order_events(order_id, status, note) values(result.id, p_status, p_note);
  return result;
end;
$$;
revoke all on function private.update_order_status(uuid, text, text) from public, anon;
grant execute on function private.update_order_status(uuid, text, text) to authenticated;
create function public.update_order_status(p_order_id uuid, p_status text, p_note text default '') returns public.store_orders
language sql security invoker set search_path = '' as $$ select private.update_order_status(p_order_id, p_status, p_note); $$;
revoke all on function public.update_order_status(uuid, text, text) from public, anon;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values('store-product-photos', 'store-product-photos', true, 5242880, array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy store_photos_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'store-product-photos' and (select private.is_store_admin()));
create policy store_photos_owner_update on storage.objects for update to authenticated using (bucket_id = 'store-product-photos' and (select private.is_store_admin())) with check (bucket_id = 'store-product-photos' and (select private.is_store_admin()));
create policy store_photos_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'store-product-photos' and (select private.is_store_admin()));
create policy store_photos_owner_read on storage.objects for select to authenticated using (bucket_id = 'store-product-photos' and (select private.is_store_admin()));

commit;
