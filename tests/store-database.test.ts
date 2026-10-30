import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { products } from "../src/lib/catalogue.ts";

const db = new PGlite();
const alice = "10000000-0000-4000-8000-000000000001";
const bob = "10000000-0000-4000-8000-000000000002";
const owner = "10000000-0000-4000-8000-000000000003";
const product = products.find(product => product.id === "black-three-piece-gift-set")!;
const cart = [{ productId: product.id, quantity: 2, customization: "Ama", optionId: "customized" }];
let orderId = "";

async function asUser<T>(userId: string | null, run: () => Promise<T>): Promise<T> {
  await db.exec(userId ? "set role authenticated" : "set role anon");
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [userId ?? "", JSON.stringify({ email: "test@example.com", user_metadata: { is_admin: true } })]);
  try { return await run(); } finally { await db.exec("reset role"); }
}

before(async () => {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant usage on schema auth to anon, authenticated;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
  `);
  await db.query("insert into auth.users(id,email,email_confirmed_at) values ($1,'a@example.com',now()),($2,'b@example.com',now()),($3,'owner@example.com',now())", [alice,bob,owner]);
  await db.exec(readFileSync("supabase/migrations/202610300001_store_management.sql", "utf8"));
  await db.query("insert into private.store_admins(user_id) values($1)", [owner]);
  for (const entry of [product, products[0]]) await db.query("insert into public.store_products(id,details,stock_quantity,stock_status) values($1,$2,10,'available')", [entry.id, JSON.stringify(entry)]);
});
after(async () => { await db.close(); });

test("all catalogue entries seed correctly and public visitors only see active products", async () => {
  await db.exec(readFileSync("supabase/migrations/202610300002_seed_catalogue.sql", "utf8"));
  const count = await db.query<{ count: number }>("select count(*)::int as count from public.store_products");
  assert.equal(count.rows[0].count, products.length);
  await db.query("insert into public.store_products(id,details,active) values('hidden-owner-test',$1,false)", [JSON.stringify({ ...product, id: "hidden-owner-test" })]);
  await asUser(null, async () => {
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from public.store_products")).rows[0].count, products.length);
    await assert.rejects(db.query("select * from public.store_orders"), /permission denied/);
    await assert.rejects(db.query("select public.store_access()"), /permission denied/);
  });
  await asUser(alice, async () => { assert.equal((await db.query("select id from public.store_products where id='hidden-owner-test'")).rows.length, 0); });
  await asUser(owner, async () => { assert.equal((await db.query("select id from public.store_products where id='hidden-owner-test'")).rows.length, 1); });
  await db.exec("delete from public.store_products where id='hidden-owner-test'");
});

test("database rejects customers and metadata tricks as store owners", async () => {
  await asUser(alice, async () => {
    assert.equal((await db.query<{ store_access: boolean }>("select public.store_access() as store_access")).rows[0].store_access, false);
    await assert.rejects(db.query("insert into private.store_admins(user_id) values($1)", [alice]), /permission denied/);
    const update = await db.query("update public.store_products set stock_quantity=999 where id=$1", [product.id]);
    assert.equal(update.affectedRows, 0);
    await assert.rejects(db.query("insert into public.store_products(id,details) values('fake',$1)", [JSON.stringify({ ...product, id: "fake" })]), /row-level security/);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('store-product-photos','fake.jpg')"), /row-level security/);
  });
  await asUser(owner, async () => {
    assert.equal((await db.query<{ value: boolean }>("select public.store_access() as value")).rows[0].value, true);
    await db.query("insert into storage.objects(bucket_id,name) values('store-product-photos','owner.jpg')");
  });
});

test("profile and saved products belong only to the signed-in customer", async () => {
  await asUser(alice, async () => {
    await db.query("insert into public.customer_profiles(user_id,name,address) values($1,'Alice','Private address')", [alice]);
    await db.query("insert into public.customer_favorites(user_id,product_id) values($1,$2)", [alice,product.id]);
    await assert.rejects(db.query("insert into public.customer_profiles(user_id,name) values($1,'Fake')", [bob]), /row-level security/);
  });
  await asUser(bob, async () => {
    assert.equal((await db.query("select * from public.customer_profiles")).rows.length, 0);
    assert.equal((await db.query("select * from public.customer_favorites")).rows.length, 0);
    assert.equal((await db.query("update public.customer_profiles set address='stolen' where user_id=$1", [alice])).affectedRows, 0);
  });
});

test("order requests price from the server, are idempotent and cannot be forged", async () => {
  const key = "20000000-0000-4000-8000-000000000001";
  await asUser(null, async () => { await assert.rejects(db.query("select public.create_order_request($1,$2)", [JSON.stringify(cart),key]), /permission denied/); });
  await asUser(alice, async () => {
    const result = await db.query<{ value: { id: string; subtotal: number; items: Array<{ unitPrice: number }> } }>("select to_jsonb(public.create_order_request($1,$2)) as value", [JSON.stringify([{ ...cart[0], priceGhs: 1, user_id: bob }]),key]);
    orderId = result.rows[0].value.id;
    assert.equal(result.rows[0].value.subtotal, 800);
    assert.equal(result.rows[0].value.items[0].unitPrice, 400);
    const retry = await db.query<{ value: { id: string } }>("select to_jsonb(public.create_order_request($1,$2)) as value", [JSON.stringify([{ ...cart[0], priceGhs: 1, user_id: bob }]),key]);
    assert.equal(retry.rows[0].value.id, orderId);
    assert.equal((await db.query("select * from public.store_orders")).rows.length, 1);
    await assert.rejects(db.query("select public.create_order_request($1,$2)", [JSON.stringify([{ ...cart[0], quantity: 3 }]),key]), /bag changed/);
    await assert.rejects(db.query("insert into public.store_orders(user_id,request_key,request_signature,items,contact) values($1,gen_random_uuid(),'fake','[]','{}')", [alice]), /permission denied/);
    await assert.rejects(db.query("select public.update_order_status($1,'delivered','fake')", [orderId]), /Owner access/);
  });
});

test("other customers cannot read order details or status events", async () => {
  await asUser(bob, async () => {
    assert.equal((await db.query("select * from public.store_orders where id=$1", [orderId])).rows.length, 0);
    assert.equal((await db.query("select * from public.store_order_events where order_id=$1", [orderId])).rows.length, 0);
    await assert.rejects(db.query("update public.store_orders set status='delivered' where id=$1", [orderId]), /permission denied/);
  });
});

test("owner status changes reserve stock once, record history and restore cancellation stock", async () => {
  await asUser(owner, async () => {
    await assert.rejects(db.query("select public.update_order_status($1,'delivered','jump')", [orderId]), /not available/);
    await db.query("select public.update_order_status($1,'confirmed','Confirmed with customer')", [orderId]);
    await db.query("select public.update_order_status($1,'confirmed','Retry')", [orderId]);
    assert.equal((await db.query<{ stock_quantity: number }>("select stock_quantity from public.store_products where id=$1", [product.id])).rows[0].stock_quantity, 8);
    await db.query("select public.update_order_status($1,'customising','Engraving started')", [orderId]);
    await db.query("select public.update_order_status($1,'cancelled','Cancelled with customer')", [orderId]);
    assert.equal((await db.query<{ stock_quantity: number }>("select stock_quantity from public.store_products where id=$1", [product.id])).rows[0].stock_quantity, 10);
    await assert.rejects(db.query("select public.update_order_status($1,'confirmed','Reopen')", [orderId]), /not available/);
  });
  await asUser(alice, async () => { assert.equal((await db.query("select * from public.store_order_events where order_id=$1", [orderId])).rows.length, 4); });
});

test("unavailable products, invalid options and aggregate stock limits block requests", async () => {
  await asUser(alice, async () => {
    const query = (items: unknown[]) => db.query("select public.create_order_request($1,gen_random_uuid())", [JSON.stringify(items)]);
    await assert.rejects(query([{ ...cart[0], optionId: "fake" }]), /customisation option/);
    await assert.rejects(query([{ ...cart[0], quantity: 1.5 }]), /quantities/);
    await assert.rejects(query([{ ...cart[0], quantity: 6 }, { ...cart[0], quantity: 5, customization: "Bob" }]), /no longer available/);
    await assert.rejects(query([{ ...cart[0], referenceImage: "https://fake.example/photo.jpg" }]), /current product photo/);
  });
});
