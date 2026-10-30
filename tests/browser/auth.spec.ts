import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function mockSupabaseAuth(page: import("@playwright/test").Page) {
  await page.route("https://gangouwtzbymjlmlumiu.supabase.co/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/recover")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ message: "Invalid login credentials" }),
    });
  });
}

async function mockSuccessfulSignIn(page: import("@playwright/test").Page) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const accessToken = [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({ aud: "authenticated", exp: now + 3600, sub: "00000000-0000-4000-8000-000000000001", role: "authenticated" }),
    "mock-signature",
  ].join(".");
  const timestamp = new Date(now * 1000).toISOString();

  await page.route("https://gangouwtzbymjlmlumiu.supabase.co/**", async route => {
    if (new URL(route.request().url()).pathname.endsWith("/logout")) {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    if (new URL(route.request().url()).pathname.endsWith("/token")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: now + 3600,
          refresh_token: "mock-refresh-token",
          user: {
            id: "00000000-0000-4000-8000-000000000001",
            aud: "authenticated",
            role: "authenticated",
            email: "ama@example.com",
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: {},
            identities: [],
            created_at: timestamp,
            updated_at: timestamp,
          },
        }),
      });
      return;
    }
    await route.fulfill({ status: 400, contentType: "application/json", body: "{}" });
  });
}

test("validates, toggles passwords, and never simulates authentication", async ({ page }) => {
  await mockSupabaseAuth(page);
  await page.goto("/login/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText("Please enter your email address.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address", exact: true })).toBeFocused();
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("ama@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secure passphrase");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password", exact: true }).click();
  await page.getByText("Remember me", { exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText(/We couldn't complete that request/)).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  expect(new URL(page.url()).pathname).toBe("/login/");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("remember me controls whether Supabase session cookies persist", async ({ page }) => {
  await mockSuccessfulSignIn(page);
  await page.goto("/login/");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("ama@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secure passphrase");
  await page.getByText("Remember me", { exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);

  const rememberedCookies = await page.context().cookies("http://localhost:3000");
  const rememberedSession = rememberedCookies.find(cookie => cookie.name.startsWith("sb-gangouwtzbymjlmlumiu-auth-token"));
  expect(rememberedSession?.expires).toBeGreaterThan(Date.now() / 1000 + 300 * 24 * 60 * 60);
  expect(rememberedCookies.find(cookie => cookie.name === "bbr-remember-session")?.value).toBe("1");

  await page.context().clearCookies();
  await page.goto("/login/");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("ama@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secure passphrase");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);

  const sessionCookies = await page.context().cookies("http://localhost:3000");
  const sessionCookie = sessionCookies.find(cookie => cookie.name.startsWith("sb-gangouwtzbymjlmlumiu-auth-token"));
  expect(sessionCookie?.expires).toBe(-1);
  expect(sessionCookies.find(cookie => cookie.name === "bbr-remember-session")).toBeUndefined();
});

test("login returns shoppers to the store with their custom bag intact", async ({ page, isMobile }) => {
  await mockSuccessfulSignIn(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const directory = path.resolve(".sites-runtime/previews/mobile-check");
  if (isMobile) await mkdir(directory, { recursive: true });

  await page.goto("/shop/");
  await page.getByRole("button", { name: "Choose options for Personalized Diaries", exact: true }).click();
  const options = page.getByRole("dialog", { name: "Personalized Diaries" });
  await options.getByLabel("Name, initials or cover request").fill("Ama · blue cover, please");
  await options.getByRole("button", { name: "Increase quantity for Personalized Diaries" }).click();
  await options.getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("link", { name: "Log in or sign up" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  if (isMobile) await page.screenshot({ path: path.join(directory, "login.png"), fullPage: true, animations: "disabled" });

  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("ama@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-only passphrase");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  await expect(page.getByRole("button", { name: "Open shopping bag, 2 items" })).toBeVisible();
  if (isMobile) {
    await page.getByRole("heading", { name: "Shop Big B Royale" }).click();
    await page.screenshot({ path: path.join(directory, "store-after-login.png"), animations: "disabled" });
  }
  await page.getByRole("button", { name: "Open shopping bag, 2 items" }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-customization")).toContainText("Ama · blue cover, please");
  const checkout = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!);
  expect(checkout.pathname).toBe("/233557356892");
  expect(checkout.searchParams.get("text")).toContain("Personalized Diaries");
  expect(checkout.searchParams.get("text")).toContain("Quantity: 2");
  expect(checkout.searchParams.get("text")).toContain("Ama · blue cover, please");
  if (isMobile) await page.screenshot({ path: path.join(directory, "bag-after-login.png"), animations: "disabled" });
  expect(errors).toEqual([]);
});

test("signed-in shoppers can view their account, reload and sign out without losing their bag", async ({ page, isMobile }) => {
  test.setTimeout(60000);
  await mockSuccessfulSignIn(page);
  await page.goto("/shop/");
  await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("link", { name: "Log in or sign up" }).click();
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("ama@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-only passphrase");
  await page.getByText("Remember me", { exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  await page.getByRole("link", { name: "Your account", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
  await expect(page.getByText("ama@example.com", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Log in", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  if (isMobile) await page.screenshot({ path: path.resolve(".sites-runtime/previews/mobile-check/account.png"), fullPage: true, animations: "disabled" });
  const logout = page.waitForRequest(request => new URL(request.url()).pathname.endsWith("/logout"));
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  expect(new URL((await logout).url()).searchParams.get("scope")).toBe("local");
  await expect(page.getByRole("tab", { name: "Log in", exact: true })).toBeVisible();
  const cookies = await page.context().cookies("http://localhost:3000");
  expect(cookies.some(cookie => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))).toBe(false);
  expect(cookies.some(cookie => cookie.name === "bbr-remember-session")).toBe(false);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Log in", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Visit the store" }).click();
  await expect(page.getByRole("button", { name: "Open shopping bag, 1 item" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in or sign up" })).toBeVisible();
});

test("signup validates confirmation and clears passwords between tabs", async ({ page }) => {
  await mockSupabaseAuth(page);
  await page.goto("/login/");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Full name").fill("Ama Mensah");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("ama@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secure passphrase");
  await page.getByLabel("Confirm password", { exact: true }).fill("different passphrase");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText(/Your passwords don't match/)).toBeVisible();
  await page.getByLabel("Confirm password", { exact: true }).fill("secure passphrase");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText(/We couldn't complete that request/)).toBeVisible();
  await page.getByRole("tab", { name: "Log in" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Full name")).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe("/login/");
});

test("reset dialog validates, traps focus, and closes with Escape", async ({ page }) => {
  await mockSupabaseAuth(page);
  await page.goto("/login/");
  const trigger = page.getByRole("button", { name: "Forgot password?" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Send reset link" }).click();
  await expect(dialog.getByText("Please enter your email address.")).toBeVisible();
  await dialog.getByLabel("Email address").fill("ama@example.com");
  await dialog.getByRole("button", { name: "Send reset link" }).click();
  await expect(dialog.getByText(/If an account exists for this email/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("recovery links let a user set a new password", async ({ page }) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const accessToken = [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({ aud: "authenticated", exp: now + 3600, sub: "00000000-0000-4000-8000-000000000001", role: "authenticated" }),
    "mock-signature",
  ].join(".");
  const timestamp = new Date(now * 1000).toISOString();
  const user = {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "ama@example.com",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    created_at: timestamp,
    updated_at: timestamp,
  };
  await page.route("https://gangouwtzbymjlmlumiu.supabase.co/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/recover")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }
    if (path.endsWith("/token")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: now + 3600,
          refresh_token: "mock-refresh-token",
          user,
        }),
      });
      return;
    }
    if (path.endsWith("/user")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
      return;
    }
    await route.fulfill({ status: 400, contentType: "application/json", body: "{}" });
  });

  await page.goto("/login/");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByRole("dialog").getByLabel("Email address").fill("ama@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If an account exists for this email/)).toBeVisible();
  await page.goto("/?code=mock-recovery-code");
  await expect(page).toHaveURL(/\/login\//);
  await expect(page.getByRole("heading", { name: "Choose a new password." })).toBeVisible();
  await page.getByRole("textbox", { name: "New password", exact: true }).fill("a new secure passphrase");
  await page.getByRole("textbox", { name: "Confirm new password", exact: true }).fill("a new secure passphrase");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Your password has been updated.")).toBeVisible();
  await page.getByRole("button", { name: "Continue to your account" }).click();
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
});

test("tabs support keyboard navigation and layouts have no overflow", async ({ page }) => {
  await page.goto("/login/");
  await page.getByRole("tab", { name: "Log in" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Sign up" })).toBeFocused();
  await expect(page.getByLabel("Full name")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("both modes and reset dialog pass WCAG AA automated checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login/");
  const scan = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect((await scan()).violations).toEqual([]);
  await page.getByRole("tab", { name: "Sign up" }).click();
  expect((await scan()).violations).toEqual([]);
  await page.getByRole("tab", { name: "Log in" }).click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  expect((await scan()).violations).toEqual([]);
});
