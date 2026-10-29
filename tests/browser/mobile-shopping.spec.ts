import { test, expect } from "@playwright/test";
import { products } from "../../src/lib/catalogue";

test("phone navigation and product actions remain reachable at small and landscape sizes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Phone navigation is intentionally hidden on desktop.");
  test.setTimeout(90000);
  for (const size of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await page.goto("/shop/");
    const navigation = page.getByRole("navigation", { name: "Mobile shopping", exact: true });
    await expect(navigation).toBeVisible();
    for (const control of await navigation.locator("a, button").all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.y + box.height).toBeLessThanOrEqual(size.height + 1);
    }
    await navigation.getByRole("link", { name: "Shop", exact: true }).click();
    const sectionTop = await page.locator("#collection").evaluate(element => element.getBoundingClientRect().top);
    const headerBottom = await page.locator(".store-header").evaluate(element => element.getBoundingClientRect().bottom);
    expect(sectionTop).toBeGreaterThanOrEqual(headerBottom);
    await page.getByRole("button", { name: "Choose options for Kobby Style Bracelet", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Kobby Style Bracelet", exact: true });
    const add = dialog.getByRole("button", { name: "Add to bag", exact: true });
    const addBox = (await add.boundingBox())!;
    expect(addBox.y).toBeGreaterThanOrEqual(0);
    expect(addBox.y + addBox.height).toBeLessThanOrEqual(size.height);
    const increase = dialog.getByRole("button", { name: "Increase quantity for Kobby Style Bracelet", exact: true });
    expect((await increase.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await increase.click();
    await expect(dialog.locator(".quantity-control > span")).toHaveText("2");
    await dialog.getByLabel("Name, initials or personalisation").fill("Ama");
    await add.click();
    await expect(dialog).not.toBeVisible();
    await navigation.getByRole("button", { name: "Open shopping bag, 2 items", exact: true }).click();
    const bag = page.getByRole("dialog", { name: /^Your bag/ });
    const checkout = bag.getByRole("link", { name: "Continue on WhatsApp", exact: true });
    await checkout.click({ trial: true });
    const message = new URL((await checkout.getAttribute("href"))!).searchParams.get("text")!;
    expect(message).toContain("Quantity: 2");
    expect(message).toContain("Ama");
    await bag.getByRole("button", { name: /Remove Kobby Style Bracelet/ }).click();
    await bag.getByRole("button", { name: "Close shopping bag", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("mobile search resets a category filter and returns to the collection after submit", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This check exercises the phone shopping controls.");
  await page.goto("/shop/");
  await page.getByRole("button", { name: "Bracelets", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(18);
  const search = page.getByRole("textbox", { name: "Search products", exact: true });
  await search.fill("charger");
  await search.press("Enter");
  await expect(search).not.toBeFocused();
  await expect(page.locator(".product-card h3")).toHaveText(["Phone Charger", "White Phone Charger & Cable"]);
  await page.getByRole("navigation", { name: "Mobile shopping", exact: true }).getByRole("link", { name: "Shop", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});
