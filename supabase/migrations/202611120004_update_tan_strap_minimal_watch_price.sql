update public.store_products
set details = jsonb_set(details, '{priceGhs}', '180'::jsonb),
    updated_at = now()
where id = 'watch-tan-minimal';
