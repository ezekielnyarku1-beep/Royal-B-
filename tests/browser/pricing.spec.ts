import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/store_products*', route => route.fulfill({ status: 404, json: {} }));
});

test("jewellery and mirrors show their prices and carry them into WhatsApp", async ({ page }) => {
  await page.goto("/shop/");
  for (const [name, price] of [["Sculptural Cuff Bangle", "GH₵60.00"], ["Arched Floor Mirror", "GH₵360.00"]]) {
    await page.getByRole("textbox", { name: "Search products", exact: true }).fill(name);
    await expect(page.locator(".product-price")).toHaveText([price]);
    await page.getByRole("button", { name: `Choose options for ${name}`, exact: true }).click();
    await expect(page.locator(".detail-price")).toHaveText(price);
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  }
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 2 items", exact: true }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵420.00");
  const message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Listed unit price: GHS 60.00");
  expect(message).toContain("Listed unit price: GHS 360.00");
  expect(message).toContain("Items subtotal: GHS 420.00");
});

test("power-bank capacities are searchable and watch totals remain guide prices", async ({ page }) => {
  await page.goto("/shop/");
  const search = page.getByRole("textbox", { name: "Search products", exact: true });
  await search.fill("20000");
  await expect(page.locator(".product-price")).toHaveText(["GH₵200.00"]);
  await search.fill("10000");
  await expect(page.locator(".product-price")).toHaveText(["GH₵150.00", "GH₵150.00"]);
  await search.fill("Rose Tone Black Dial Watch");
  await expect(page.locator(".product-price")).toHaveText(["About GH₵200.00"]);
  await page.getByRole("button", { name: "Choose options for Rose Tone Black Dial Watch", exact: true }).click();
  await expect(page.locator(".price-guide-note")).toContainText("seller will confirm the price");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("button", { name: "Open shopping bag, 1 item", exact: true }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("Estimated items subtotal");
  const message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Guide unit price: GHS 200.00");
  expect(message).toContain("Estimated items subtotal: GHS 200.00");
});

test("set customisation updates prices, persists and merges matching options in the bag", async ({ page }) => {
  await page.goto("/shop/");
  const name = "Black Three Piece Gift Set";
  await page.getByRole("textbox", { name: "Search products", exact: true }).fill(name);
  for (const [option, price] of [["plain", "GH₵350.00"], ["customized", "GH₵400.00"]]) {
    await page.getByRole("button", { name: `Choose options for ${name}`, exact: true }).click();
    const dialog = page.getByRole("dialog", { name, exact: true });
    await dialog.getByRole("combobox", { name: `Customisation for ${name}`, exact: true }).selectOption(option);
    await expect(dialog.locator(".detail-price")).toHaveText(price);
    if (option === "customized") {
      await dialog.getByRole("button", { name: `Increase quantity for ${name}`, exact: true }).click();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    }
    await dialog.getByRole("button", { name: "Add to bag", exact: true }).click();
  }
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 3 items", exact: true }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-item")).toHaveCount(2);
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵1,150.00");
  let message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Customisation option: Without customisation");
  expect(message).toContain("Customisation option: With customisation");
  expect(message).toContain("Listed unit price: GHS 350.00");
  expect(message).toContain("Listed unit price: GHS 400.00");
  await bag.getByRole("combobox").first().selectOption("customized");
  await expect(bag.locator(".cart-item")).toHaveCount(1);
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵1,200.00");
  await expect(bag.getByRole("combobox")).toHaveValue("customized");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await bag.getByRole("combobox").selectOption("plain");
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵1,050.00");
  message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Quantity: 3");
  expect(message).toContain("Customisation option: Without customisation");
  expect(message).toContain("Items subtotal: GHS 1050.00");
});

test("saved two-piece sets require an explicit option before showing a price", async ({ page }) => {
  await page.goto("/shop/");
  await page.evaluate(() => localStorage.setItem("bbr-shopping-bag-v1", JSON.stringify([{ productId: "black-rectangular-watch-bracelet-set", quantity: 1, customization: "Name: Ama" }])));
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 1 item", exact: true }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await expect(bag.locator(".cart-item-price")).toHaveText("Choose customisation for price");
  await expect(bag.locator(".cart-priced-subtotal")).toHaveCount(0);
  await bag.getByRole("combobox").selectOption("customized");
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵400.00");
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 1 item", exact: true }).click();
  await expect(bag.getByRole("combobox")).toHaveValue("customized");
  const message = new URL((await bag.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain("Name: Ama");
  expect(message).toContain("Customisation option: With customisation");
  expect(message).toContain("Listed unit price: GHS 400.00");
});

test("changing a set option above the quantity limit explains the problem inside the bag", async ({ page }) => {
  await page.goto("/shop/");
  await page.evaluate(() => localStorage.setItem("bbr-shopping-bag-v1", JSON.stringify([
    { productId: "black-three-piece-gift-set", quantity: 98, customization: "", optionId: "plain" },
    { productId: "black-three-piece-gift-set", quantity: 2, customization: "", optionId: "customized" },
  ])));
  await page.reload();
  await page.getByRole("button", { name: "Open shopping bag, 100 items", exact: true }).click();
  const bag = page.getByRole("dialog", { name: /^Your bag/ });
  await bag.getByRole("combobox").nth(1).selectOption("plain");
  await expect(bag.getByRole("alert")).toContainText("exceed the limit of 99");
  await expect(bag.locator(".cart-item")).toHaveCount(2);
  await expect(bag.getByRole("combobox").nth(1)).toHaveValue("customized");
  await bag.getByRole("button", { name: "Decrease quantity for Black Three Piece Gift Set, Without customisation", exact: true }).click();
  await expect(bag.getByRole("alert")).toHaveCount(0);
  await bag.getByRole("combobox").nth(1).selectOption("plain");
  await expect(bag.locator(".cart-item")).toHaveCount(1);
  await expect(bag.locator(".quantity-control > span")).toHaveText("99");
  await expect(bag.locator(".cart-priced-subtotal")).toContainText("GH₵34,650.00");
});
