import { test, expect } from "@playwright/test";

async function completeSignup(page: import("@playwright/test").Page) {
  await page.goto("/login/");
  await page.getByRole("tab", { name: "Sign up", exact: true }).click();
  await page.getByLabel("Full name").fill("Ama Mensah");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("signup-test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Test-only password 123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("Test-only password 123!");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
}

test("successful signup with confirmation required gives clear next steps", async ({ page }) => {
  let requests = 0;
  await page.route("https://*.supabase.co/**", async route => {
    if (new URL(route.request().url()).pathname.endsWith("/signup")) {
      requests++;
      const request = route.request().postDataJSON();
      expect(request.email).toBe("signup-test@example.com");
      expect(request.data.name).toBe("Ama Mensah");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "00000000-0000-4000-8000-000000000002", email: "signup-test@example.com", identities: [] }, session: null }) });
      return;
    }
    await route.fulfill({ status: 400, contentType: "application/json", body: "{}" });
  });
  await completeSignup(page);
  await expect(page.locator(".form-notice")).toContainText("Check your inbox and spam folder");
  await expect(page.locator(".form-notice")).toContainText("open the link in this browser");
  await expect(page.getByRole("heading", { name: "Your royal space." })).toHaveCount(0);
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  expect(new URL(page.url()).pathname).toBe("/login/");
  expect(requests).toBe(1);
});

test("signup redirects to shopping only when Supabase supplies a real session result", async ({ page }) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const id = "00000000-0000-4000-8000-000000000002";
  const token = [encode({ alg: "HS256", typ: "JWT" }), encode({ aud: "authenticated", exp: now + 3600, sub: id, role: "authenticated" }), "test-signature"].join(".");
  await page.route("https://*.supabase.co/**", async route => {
    if (new URL(route.request().url()).pathname.endsWith("/signup")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ access_token: token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: "test-refresh-token", user: { id, aud: "authenticated", role: "authenticated", email: "signup-test@example.com", user_metadata: { name: "Ama Mensah" }, app_metadata: { provider: "email", providers: ["email"] }, identities: [], created_at: new Date().toISOString() } }) });
      return;
    }
    await route.fulfill({ status: 400, contentType: "application/json", body: "{}" });
  });
  await completeSignup(page);
  await expect(page).toHaveURL(/\/shop\//);
  await expect(page.getByRole("link", { name: "Your account", exact: true }).first()).toBeVisible();
});

test("signup displays the email-delivery restriction and safe support reference", async ({ page }) => {
  await page.route("https://*.supabase.co/**", async route => {
    await route.fulfill({ status: 403, headers: { "X-Supabase-Api-Version": "2024-01-01", "Access-Control-Expose-Headers": "X-Supabase-Api-Version" }, contentType: "application/json", body: JSON.stringify({ code: "email_address_not_authorized", msg: "Email address not authorized" }) });
  });
  await completeSignup(page);
  await expect(page.locator(".form-notice")).toContainText("Confirmation emails are not enabled for new customer addresses");
  await expect(page.locator(".auth-error-reference")).toHaveText("Support reference: email_address_not_authorized");
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeEnabled();
  expect(new URL(page.url()).pathname).toBe("/login/");
});

test("signup rate limits are clear and never trigger automatic retries", async ({ page }) => {
  let requests = 0;
  await page.route("https://*.supabase.co/**", async route => {
    if (new URL(route.request().url()).pathname.endsWith("/signup")) requests++;
    await route.fulfill({ status: 429, headers: { "X-Supabase-Api-Version": "2024-01-01", "Access-Control-Expose-Headers": "X-Supabase-Api-Version" }, contentType: "application/json", body: JSON.stringify({ code: "over_email_send_rate_limit", msg: "email rate limit exceeded" }) });
  });
  await completeSignup(page);
  await expect(page.locator(".form-notice")).toContainText("Confirmation emails are temporarily limited");
  await expect(page.locator(".auth-error-reference")).toContainText("over_email_send_rate_limit");
  expect(requests).toBe(1);
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeEnabled();
});
