import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("shows honest sample information, category filtering, search and empty results", async ({ page }) => {
  await page.goto("/shop/");
  await expect(page.getByRole("heading", { name: /Your everyday/ })).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(8);
  await expect(page.locator(".product-price")).toHaveText(Array(8).fill("Contact for Price"));
  await expect(page.locator(".availability")).toHaveText(Array(8).fill("Confirm Availability"));
  await expect(page.locator(".placeholder-label")).toHaveCount(8);
  await page.getByRole("button", { name: "Bracelets", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "All products", exact: true }).click();
  await page.getByRole("textbox", { name: "Search products" }).fill("diaries");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card h3")).toHaveText("Personalized Diaries");
  await page.getByRole("textbox", { name: "Search products" }).fill("no-matching-product");
  await expect(page.getByRole("heading", { name: "No finds just yet." })).toBeVisible();
  await page.getByRole("button", { name: "Show all products" }).click();
  await page.getByLabel("Sort by").selectOption("name");
  await expect(page.locator(".product-card h3").first()).toHaveText("Bedsheet Sets");
  for (const image of await page.locator(".product-image-button img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
});

test("customised bag persists and produces the right WhatsApp draft without sending", async ({ page }) => {
  await page.goto("/shop/");
  await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
  const product = page.getByRole("dialog", { name: "Customized Bracelets" });
  await expect(product).toBeVisible();
  await product.getByLabel("Name, initials or personalisation").fill("Ama & Kofi · initials A+B");
  await product.getByRole("button", { name: "Increase quantity for Customized Bracelets" }).click();
  await product.getByRole("button", { name: "Add to bag" }).click();
  await expect(product).not.toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 2 items" }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-customization")).toContainText("Ama & Kofi · initials A+B");
  const checkout = bag.getByRole("link", { name: "Continue on WhatsApp" });
  const url = new URL((await checkout.getAttribute("href"))!);
  expect(url.origin).toBe("https://wa.me");
  expect(url.pathname).toBe("/233557356892");
  const message = url.searchParams.get("text")!;
  expect(message).toContain("Quantity: 2");
  expect(message).toContain("Ama & Kofi · initials A+B");
  expect(message).toContain("prices in Ghana Cedis (GHS), availability");
  expect(message).toContain("delivery options and charges");
  expect(message).toContain("not a paid or confirmed order");
  await bag.getByText("Preview your WhatsApp enquiry").click();
  await expect(bag.locator("pre")).toContainText(message);
  await bag.getByRole("button", { name: /Remove Customized Bracelets/ }).click();
  await expect(bag.getByRole("heading", { name: "A little room for something lovely." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open shopping bag, 0 items" })).toBeFocused();
});

test("shop, product details and shopping bag pass automated WCAG AA checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/shop/");
  const scan = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect((await scan()).violations).toEqual([]);
  await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
  expect((await scan()).violations).toEqual([]);
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("button", { name: "Open shopping bag, 1 item" }).click();
  expect((await scan()).violations).toEqual([]);
});

test("navigation preserves account route and small screens never overflow", async ({ page, isMobile }) => {
  await page.goto("/shop/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (isMobile) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("navigation", { name: "Store navigation" }).getByRole("link", { name: "Personalised gifts" }).click();
    await expect(page.locator(".product-card")).toHaveCount(5);
    await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  }
  await page.getByRole("link", { name: "Log in or sign up" }).click();
  await expect(page.getByRole("tab", { name: "Log in", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Visit the store" }).click();
  await expect(page).toHaveURL(/\/shop\//);
});
