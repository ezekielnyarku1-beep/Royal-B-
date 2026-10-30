import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/store_products*', route => route.fulfill({ status: 404, json: {} }));
});

test("new watches, home items and gifts have their own photos and the supplied price types", async ({ page, isMobile }) => {
  await page.goto("/shop/");
  for (const [category, count] of [["Watches", 22], ["Gift Sets", 13], ["Home & Living", 12], ["Curtains", 4], ["Bedsheets", 4], ["Jewelry", 3]] as const) {
    await page.getByRole("button", { name: category, exact: true }).click();
    await expect(page.locator(".product-card")).toHaveCount(count);
    if (category === "Watches") await expect(page.locator(".product-price")).toHaveText(Array(count).fill("About GH₵200.00"));
    else if (category === "Gift Sets") {
      await expect(page.locator(".product-price").filter({ hasText: "From GH₵350.00" })).toHaveCount(10);
      await expect(page.locator(".product-price").filter({ hasText: "Contact for Price" })).toHaveCount(3);
    } else if (category === "Jewelry") await expect(page.locator(".product-price")).toHaveText(Array(count).fill("GH₵60.00"));
    else if (category === "Home & Living") {
      await expect(page.locator(".product-price").filter({ hasText: "GH₵360.00" })).toHaveCount(2);
      await expect(page.locator(".product-price").filter({ hasText: "Contact for Price" })).toHaveCount(10);
    } else await expect(page.locator(".product-price")).toHaveText(Array(count).fill("Contact for Price"));
    await expect(page.locator(".placeholder-label")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  if (isMobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("navigation", { name: "Store navigation", exact: true }).getByRole("link", { name: "Home & living", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(20);
  await expect(page.getByRole("heading", { name: "Grey Quilted Bedding", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Green Textured Curtains", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Side Shelf Clothes Rack", exact: true })).toBeVisible();
});

test("new gift sets and personalisation survive reload and produce an unpriced WhatsApp draft", async ({ page }) => {
  await page.goto("/shop/");
  await page.getByRole("textbox", { name: "Search products", exact: true }).fill("photo necklace & bracelet");
  await page.getByRole("button", { name: "Choose options for Photo Necklace & Bracelet Gift Set", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Photo Necklace & Bracelet Gift Set", exact: true });
  await expect(dialog.locator(".detail-price")).toHaveText("Contact for Price");
  await expect(dialog.locator(".product-gallery-stage img")).toHaveAttribute("src", "/products/collection/photo-necklace-bracelet-set.jpg");
  await expect(dialog.locator(".customization-help")).toContainText("Send your photo directly to the seller on WhatsApp");
  await dialog.getByLabel("Set contents and personalisation").fill("Own portrait; bracelet name Ama. Please quote for both pieces.");
  await dialog.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 1 item", exact: true }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-item-image img")).toHaveAttribute("src", "/products/collection/photo-necklace-bracelet-set.jpg");
  const message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp", exact: true }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Photo Necklace & Bracelet Gift Set");
  expect(message).toContain("Own portrait; bracelet name Ama");
  expect(message).toContain("Price: please quote");
  expect(message).toContain("I will send my photo in this chat");
  expect(message).toContain("delivery options and charges");
  expect(message).not.toContain("Listed unit price");
});
