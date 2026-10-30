import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { validateProduct } from "../../src/lib/commerce-types";
import { products } from "../../src/lib/catalogue";

test.setTimeout(60000);

async function fixture(page: Page, owner = false) {
  const now = Math.floor(Date.now() / 1000);
  const user = { id: "10000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "customer@example.com", user_metadata: { is_admin: true }, app_metadata: { provider: "email", providers: ["email"] }, created_at: new Date().toISOString() };
  const token = [Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: user.id, exp: now + 3600, role: "authenticated", aud: "authenticated" })).toString("base64url"), "test-signature"].join(".");
  let favorites: { product_id: string }[] = [];
  let profile: Record<string, unknown> | null = null;
  const rows = products.slice(0, 3).map(details => ({ id: details.id, details: { ...details }, active: true, stock_quantity: null, stock_status: "confirm", updated_at: new Date().toISOString() }));
  let orders: Record<string, unknown>[] = [];
  await page.route("https://gangouwtzbymjlmlumiu.supabase.co/**", async route => {
    const request = route.request(); const url = new URL(request.url()); const body = request.postDataJSON();
    let data: unknown = [];
    if (url.pathname.endsWith("/token")) data = { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: "fixture-refresh", user };
    else if (url.pathname.endsWith("/user")) data = user;
    else if (url.pathname.endsWith("/logout")) { await route.fulfill({ status: 204, body: "" }); return; }
    else if (url.pathname.endsWith("/store_access")) data = owner;
    else if (url.pathname.endsWith("/store_products")) {
      if (request.method() === "POST") { const index = rows.findIndex(row => row.id === body.id); if (index >= 0) rows[index] = body; else rows.push(body); }
      for (const row of rows) expect(validateProduct(row.details)).toBeNull();
      data = rows.filter(row => url.searchParams.get("active") !== "eq.true" || row.active);
    } else if (url.pathname.endsWith("/customer_favorites")) {
      if (request.method() === "POST") favorites = [{ product_id: body.product_id }];
      if (request.method() === "DELETE") favorites = [];
      data = favorites;
    } else if (url.pathname.endsWith("/customer_profiles")) { if (request.method() === "POST") profile = body; data = profile; }
    else if (url.pathname.endsWith("/create_order_request")) {
      const entry = rows.find(row => row.id === body.p_items[0].productId)!;
      data = { id: "20000000-0000-4000-8000-000000000001", reference: "BBR-TEST12345678", user_id: user.id, status: "requested", items: [{ ...body.p_items[0], name: entry.details.name, image: entry.details.image, unitPrice: 130, estimated: false }], contact: { name: "Ama", email: user.email }, subtotal: 130, unpriced_quantity: 0, has_estimate: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; orders = [data as Record<string, unknown>];
    } else if (url.pathname.endsWith("/store_orders")) data = orders;
    else if (url.pathname.endsWith("/store_order_events")) data = [{ id: 1, status: "requested", note: "", created_at: new Date().toISOString() }];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("testing passphrase");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//, { timeout: 15000 });
  await expect(page.locator(".product-card")).toHaveCount(3);
}

test("customer saves products and delivery details, and cannot open owner tools", async ({ page }) => {
  await fixture(page);
  await page.getByRole("button", { name: "Save Customized Bracelets to saved products", exact: true }).click();
  await page.goto("/account/?tab=saved");
  await expect(page.getByRole("heading", { name: "Customized Bracelets", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "My details", exact: true }).click();
  await page.getByLabel("Full name").fill("Ama Mensah");
  await page.getByLabel("Phone number", { exact: false }).fill("+233557356892");
  await page.getByLabel("Town or city").fill("Accra");
  await page.getByLabel("Delivery address").fill("High Street");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.getByText("Your details are saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Ama Mensah");
  await page.getByLabel("Town or city").fill("Kumasi draft");
  await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname.endsWith("/customer_profiles")),
    page.evaluate(() => window.dispatchEvent(new Event("focus"))),
  ]);
  await expect(page.getByLabel("Town or city")).toHaveValue("Kumasi draft");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/admin/");
  await expect(page.getByRole("heading", { name: "Owner access required" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add product", exact: true })).toHaveCount(0);
});

test("saved request has a reference, appears in history and keeps WhatsApp as an explicit step", async ({ page }) => {
  await fixture(page);
  await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("button", { name: /^Open shopping bag/ }).click();
  await page.getByRole("button", { name: "Save request for tracking" }).click();
  await expect(page.getByText("BBR-TEST12345678", { exact: true })).toBeVisible();
  const link = page.getByRole("link", { name: "Continue on WhatsApp" });
  expect(new URL((await link.getAttribute("href"))!).searchParams.get("text")).toContain("BBR-TEST12345678");
  await page.getByRole("link", { name: "View your orders" }).click();
  await page.getByRole("button", { name: /BBR-TEST12345678/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Updates", exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("owner edits real product data and the mobile editor stays readable", async ({ page, isMobile }) => {
  await fixture(page, true);
  await page.goto("/admin/");
  await page.getByRole("button", { name: /Customized Bracelets.*Edit/ }).click();
  await expect(page.getByRole("heading", { name: "Edit product" })).toBeVisible();
  if (isMobile) {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.getByRole("dialog").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      expect(await page.getByLabel("Product name").evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    }
  }
  await page.getByRole("spinbutton", { name: /^Price/ }).fill("135");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Customized Bracelets.*135/ })).toBeVisible();
  if (isMobile) { await mkdir(".sites-runtime/screenshots", { recursive: true }); await page.screenshot({ path: ".sites-runtime/screenshots/owner-mobile.png", fullPage: true }); }
  await page.goto("/shop/");
  await expect(page.locator(".product-card")).toHaveCount(3, { timeout: 15000 });
  await expect(page.locator(".product-card").first().getByText(/135/)).toBeVisible();
});
