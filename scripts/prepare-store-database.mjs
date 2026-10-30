import { mkdir, readFile, writeFile } from "node:fs/promises";
import { products } from "../src/lib/catalogue.ts";

const quote = value => `'${value.replaceAll("'", "''")}'`;
const rows = products.map(product => `(${quote(product.id)}, ${quote(JSON.stringify(product))}::jsonb, true, null, 'confirm')`);
const seed = `-- Generated from the existing catalogue. Existing owner edits are preserved.\nbegin;\ninsert into public.store_products(id, details, active, stock_quantity, stock_status) values\n${rows.join(',\n')}\non conflict(id) do nothing;\ncommit;\n`;
await mkdir("supabase/migrations", { recursive: true });
await writeFile("supabase/migrations/202610300002_seed_catalogue.sql", seed);

// Owner identity stays in an ignored local setup file, not in the public repo.
const input = await new Promise(resolve => { let value = ""; process.stdin.setEncoding("utf8"); process.stdin.on("data", chunk => value += chunk); process.stdin.on("end", () => resolve(value)); });
if (input.trim()) {
  const { ownerEmail } = JSON.parse(input);
  if (typeof ownerEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) throw new Error("Supply a registered owner email.");
  const bootstrap = `-- Run only as the project owner in the Supabase SQL editor.\ndo $$\ndeclare owner_id uuid;\nbegin\n  select id into owner_id from auth.users where lower(email) = lower(${quote(ownerEmail)}) and email_confirmed_at is not null;\n  if owner_id is null then raise exception 'The owner must register and confirm their email first.'; end if;\n  insert into private.store_admins(user_id) values(owner_id) on conflict do nothing;\nend $$;\n`;
  await mkdir(".sites-runtime", { recursive: true });
  await writeFile(".sites-runtime/setup-owner.sql", bootstrap);
  const schema = await readFile("supabase/migrations/202610300001_store_management.sql", "utf8");
  await writeFile(".sites-runtime/activate-store.sql", `${schema}\n${seed}\n${bootstrap}`);
}
console.log(`Prepared catalogue seed for ${products.length} products.`);
