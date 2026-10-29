import { test, expect } from "@playwright/test";
import { products } from "../../src/lib/catalogue";

test("mobile and tablet layouts fit login, signup, product options and bag", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This check exercises mobile and tablet viewports.");
  test.setTimeout(90000);
  const fitsPage = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const fitsDialog = () => page.getByRole("dialog").evaluate(element => element.scrollWidth <= element.clientWidth + 1);

  for (const width of [320, 375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
    expect(await fitsPage(), `Login fits ${width}px`).toBe(true);
    await page.getByRole("tab", { name: "Sign up" }).click();
    await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeVisible();
    expect(await fitsPage(), `Signup fits ${width}px`).toBe(true);
    await page.getByRole("link", { name: "Visit the store" }).click();
    await expect(page.locator(".product-card")).toHaveCount(products.length);
    expect(await fitsPage(), `Store fits ${width}px`).toBe(true);
    await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Customized Bracelets" })).toBeVisible();
    expect(await fitsDialog(), `Product options fit ${width}px`).toBe(true);
    await page.getByRole("button", { name: "Add to bag" }).click();
    await page.getByRole("button", { name: /^Open shopping bag/ }).click();
    expect(await fitsDialog(), `Bag fits ${width}px`).toBe(true);
    await expect(page.getByRole("link", { name: "Continue on WhatsApp" })).toBeVisible();
    await page.getByRole("button", { name: "Close shopping bag" }).click();
  }
});
