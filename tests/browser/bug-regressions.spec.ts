import { test, expect } from "@playwright/test";
import path from "node:path";
import { mkdir } from "node:fs/promises";

test("adding at the quantity limit shows an error and allows a corrected request", async ({ page }) => {
  await page.goto("/shop/");
  await page.evaluate(() => localStorage.setItem("bbr-shopping-bag-v1", JSON.stringify([{ productId: "customized-bracelets", quantity: 99, customization: "" }])));
  await page.reload();
  await expect(page.getByRole("button", { name: "Open shopping bag, 99 items" })).toBeVisible();
  await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
  const product = page.getByRole("dialog", { name: "Customized Bracelets" });
  await product.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(product.getByRole("alert")).toContainText("reached the limit of 99");
  await expect(page.locator(".shop-toast")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("bbr-shopping-bag-v1")!)[0].quantity)).toBe(99);
  await product.getByRole("button", { name: "Close product details" }).click();
  await page.getByRole("button", { name: "Open shopping bag, 99 items" }).click();
  await page.getByRole("button", { name: "Decrease quantity for Customized Bracelets" }).click();
  await page.getByRole("button", { name: "Close shopping bag" }).click();
  await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
  await product.getByRole("button", { name: "Increase quantity for Customized Bracelets" }).click();
  await product.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(product.getByRole("alert")).toContainText("You can add up to 1 more");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("bbr-shopping-bag-v1")!)[0].quantity)).toBe(98);
  await product.getByRole("button", { name: "Decrease quantity for Customized Bracelets" }).click();
  await expect(product.getByRole("alert")).toHaveCount(0);
  await product.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(product).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open shopping bag, 99 items" })).toBeVisible();
  await expect(page.locator(".shop-toast")).toContainText("added to your bag");
});

test("short landscape screens allow item editing, removal and checkout review", async ({ page, isMobile }) => {
  const directory = path.resolve(".sites-runtime/previews/mobile-check");
  if (isMobile) await mkdir(directory, { recursive: true });
  for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/shop/");
    await page.getByRole("button", { name: "Choose options for Customized Bracelets", exact: true }).click();
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await page.getByRole("button", { name: "Open shopping bag, 1 item" }).click();
    const bag = page.getByRole("dialog", { name: /^Your bag/ });
    expect(await bag.locator(".cart-drawer-body").evaluate(element => element.clientHeight - parseFloat(getComputedStyle(element).paddingBottom))).toBeGreaterThan(100);
    const increase = bag.getByRole("button", { name: "Increase quantity for Customized Bracelets" });
    await increase.scrollIntoViewIfNeeded();
    await increase.click();
    await expect(bag.getByRole("heading", { name: "Your bag 2" })).toBeVisible();
    if (isMobile && viewport.width === 568) await page.screenshot({ path: path.join(directory, "landscape-cart-fixed.png"), animations: "disabled" });
    const checkout = bag.getByRole("link", { name: "Continue on WhatsApp" });
    await checkout.scrollIntoViewIfNeeded();
    await checkout.click({ trial: true });
    expect(new URL((await checkout.getAttribute("href"))!).searchParams.get("text")).toContain("Quantity: 2");
    await bag.getByRole("button", { name: /Remove Customized Bracelets/ }).click();
    await expect(bag.getByRole("heading", { name: "Your bag is empty." })).toBeVisible();
    await page.getByRole("button", { name: "Close shopping bag" }).click();
  }
});
