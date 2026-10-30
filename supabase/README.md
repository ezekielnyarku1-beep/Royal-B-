# Store setup

The new customer and owner screens use Supabase tables and storage. Existing authentication and WhatsApp enquiries work independently of this setup.

1. In the existing Supabase project, run `migrations/202610300001_store_management.sql` once using the SQL editor or migrations tooling.
2. Run `migrations/202610300002_seed_catalogue.sql`. This adds the existing 102 products and preserves any existing product edits.
3. The owner must sign up and confirm their email. Run the contents of `setup-owner.sql.example`, replacing the example email with the registered owner's email. This requires project administrator access. Customer metadata cannot grant owner access.
4. Reload the shop. Sign in as the owner and open `/admin/`. Customers use `/account/`.

A combined, owner-specific activation file is prepared locally at `.sites-runtime/activate-store.sql`. It is ignored by Git. It includes steps 1–3; use this **instead of** running those files separately on a fresh setup. Schema creation is intended to run once. If the last owner grant fails because the email is not confirmed, finish registration and run only `.sites-runtime/setup-owner.sql`.

Product photos accept JPG, PNG and WebP files up to 5 MB, with at most two photos per listing. The `store-product-photos` bucket serves public catalogue photos. Only owners can upload or change its files. Uploading a replacement does not delete an old photo.

Orders are saved as requests. Saving does not send a WhatsApp message, take payment or confirm an order. Customers send their draft themselves. Requests use server-side prices, immutable item/contact snapshots, and an idempotency key to avoid duplicates on retry. Owner status changes create customer-visible history. Confirmation deducts known stock once; cancellation restores only the quantities reserved by that request. Blank stock remains unknown.

All customer data uses row-level security. Each customer can read only their own details, favourites and orders. Owners can manage products and see order requests. There is no client-side owner email allowlist or service-role key.

`npm.cmd test` executes the actual SQL against a local PostgreSQL WASM instance to check isolation, owner permissions, prices, duplicates, stock and status transitions. Browser tests mock provider responses; they do not create real customer accounts or send messages.
