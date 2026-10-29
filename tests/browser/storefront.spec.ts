import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { products } from "../../src/lib/catalogue";

test("shows supplied photos/prices and clearly labels the remaining sample products", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/shop/");
  await expect(page.getByRole("heading", { name: /Your everyday/ })).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(products.length);
  for (const [name, price] of [["Customized Bracelets", "GH₵130.00"], ["Personalized Name Necklaces", "GH₵100.00"], ["Photo-Customized Necklace", "GH₵140.00"], ["Customized Rings", "GH₵50.00"], ["Phone Charger", "GH₵150.00"]]) {
    await expect(page.locator(".product-card").filter({ has: page.getByRole("heading", { name, exact: true }) }).locator(".product-price")).toHaveText(price);
  }
  await expect(page.locator(".product-card").filter({ has: page.getByRole("heading", { name: "Wireless Earbuds", exact: true }) }).locator(".product-price")).toHaveText("Contact for Price");
  await expect(page.locator(".availability")).toHaveText(Array(products.length).fill("Confirm Availability"));
  await expect(page.locator(".placeholder-label").filter({ hasText: "Illustrative placeholder" })).toHaveCount(3);
  await expect(page.locator(".placeholder-label").filter({ hasText: "Pendant style reference" })).toHaveCount(0);
  await page.getByRole("button", { name: "Bracelets", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(18);
  await expect(page.getByRole("heading", { name: "Kobby Style Bracelet", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Micheal Style Bracelet", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All products", exact: true }).click();
  await page.getByRole("textbox", { name: "Search products" }).fill("diaries");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card h3")).toHaveText("Personalized Diaries");
  await page.getByRole("textbox", { name: "Search products" }).fill("no-matching-product");
  await expect(page.getByRole("heading", { name: "No finds just yet." })).toBeVisible();
  await page.getByRole("button", { name: "Show all products" }).click();
  await page.getByLabel("Sort by").selectOption("name");
  await expect(page.locator(".product-card h3")).toHaveText(products.map(product => product.name).sort((a, b) => a.localeCompare(b)));
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
  await product.getByRole("button", { name: "Choose photo 2 of 2 for Customized Bracelets", exact: true }).click();
  await expect(product.getByRole("button", { name: "Choose photo 2 of 2 for Customized Bracelets", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(product.locator(".product-gallery-stage img")).toHaveAttribute("src", "/products/collection/bracelet-and-necklace-set.jpg");
  await product.getByLabel("Name, initials or personalisation").fill("Ama & Kofi · initials A+B");
  await product.getByRole("button", { name: "Increase quantity for Customized Bracelets" }).click();
  await product.getByRole("button", { name: "Add to bag" }).click();
  await expect(product).not.toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 2 items" }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-customization")).toContainText("Ama & Kofi · initials A+B");
  await expect(bag.locator(".cart-style-reference")).toHaveText("Style reference: photo 2 of 2");
  await expect(bag.locator(".cart-item-image img")).toHaveAttribute("src", "/products/collection/bracelet-and-necklace-set.jpg");
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵260.00");
  const checkout = bag.getByRole("link", { name: "Continue on WhatsApp" });
  const url = new URL((await checkout.getAttribute("href"))!);
  expect(url.origin).toBe("https://wa.me");
  expect(url.pathname).toBe("/233557356892");
  const message = url.searchParams.get("text")!;
  expect(message).toContain("Quantity: 2");
  expect(message).toContain("Ama & Kofi · initials A+B");
  expect(message).toContain("Style reference: photo 2 of 2 (bracelet-and-necklace-set.jpg)");
  expect(message).toContain("Listed unit price: GHS 130.00");
  expect(message).toContain("Items subtotal: GHS 260.00 (delivery excluded)");
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

test("separate photo listings retain their names and prices in the shopping bag", async ({ page }) => {
  await page.goto("/shop/");
  for (const name of ["Kobby Style Bracelet", "Micheal Style Bracelet"]) {
    const card = page.locator(".product-card").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(card.locator(".product-price")).toHaveText("GH₵130.00");
    await card.getByRole("button", { name: `Choose options for ${name}`, exact: true }).click();
    const dialog = page.getByRole("dialog", { name, exact: true });
    await expect(dialog.locator(".product-thumbnails button")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Add to bag", exact: true }).click();
  }
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 2 items" }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  const message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Kobby Style Bracelet");
  expect(message).toContain("Micheal Style Bracelet");
  expect(message).toContain("Items subtotal: GHS 260.00");
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
    await expect(page.locator(".product-card")).toHaveCount(50);
    await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  }
  await page.getByRole("link", { name: "Log in or sign up" }).click();
  await expect(page.getByRole("tab", { name: "Log in", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Visit the store" }).click();
  await expect(page).toHaveURL(/\/shop\//);
});

test("photo-necklace instructions and mixed-price checkout stay clear", async ({ page }) => {
  await page.goto("/shop/");
  await page.getByRole("button", { name: "Choose options for Photo-Customized Necklace", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Photo-Customized Necklace" });
  await expect(dialog.locator(".detail-price")).toHaveText("GH₵140.00");
  await expect(dialog.locator(".gallery-caption")).toContainText("example of picture customisation");
  await expect(dialog.locator(".customization-help")).toContainText("Send your photo directly to the seller on WhatsApp");
  await dialog.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("button", { name: "Choose options for Wireless Earbuds", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Wireless Earbuds" });
  await expect(dialog.locator(".detail-price")).toHaveText("Contact for Price");
  await dialog.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("button", { name: "Open shopping bag, 2 items" }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("Priced items subtotal");
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵140.00");
  await expect(bag.locator(".cart-checkout")).toContainText("1 item needs a quote");
  await expect(bag.locator(".cart-checkout")).toContainText("Final total with delivery");
  const message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Photo customisation: I will send my photo in this chat");
  expect(message).toContain("Priced items subtotal: GHS 140.00");
  expect(message).toContain("Please quote for 1 item(s)");
});
