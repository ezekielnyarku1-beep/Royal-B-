update public.store_products
set details = jsonb_set(details, '{priceGhs}', '120'::jsonb),
    updated_at = now()
where id = 'braided-initial-bracelet';

update public.store_products
set details = jsonb_set(details, '{priceGhs}', '150'::jsonb),
    updated_at = now()
where id = 'crown-name-bracelet';

update public.store_products
set details = jsonb_set(details, '{priceGhs}', '250'::jsonb),
    updated_at = now()
where id in ('fashion-watches', 'watch-black-detail-black-strap', 'watch-black-floral-dial', 'watch-blue-link-grey-dial', 'watch-rose-mesh-brown-dial');

update public.store_products
set details = jsonb_set(details, '{priceGhs}', '45'::jsonb),
    updated_at = now()
where id = 'wireless-earbuds';
