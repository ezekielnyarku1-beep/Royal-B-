update public.store_products
set details = jsonb_set(details, '{priceGhs}', '65'::jsonb),
    updated_at = now()
where id = 'phone-charger';
