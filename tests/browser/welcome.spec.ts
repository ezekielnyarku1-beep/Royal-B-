import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

test("introduction shows the approved photos in order and links to the existing shop and login", async ({ page, isMobile }) => {
  test.setTimeout(60000);
  await page.route("https://gangouwtzbymjlmlumiu.supabase.co/**", route => route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ code: "PGRST205" }) }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome to Big B Royale." })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address", exact: true })).toHaveCount(0);
  const photos = page.locator(".intro-portrait img");
  await expect(photos).toHaveCount(3);
  for (let index = 0; index < 3; index++) {
    const photo = photos.nth(index);
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await photo.getAttribute("src")).toContain(`photo${index + 1}-`);
    expect(await photo.evaluate(image => {
      const photo = image as HTMLImageElement;
      const frame = image.getBoundingClientRect();
      return Math.abs(frame.width / frame.height - photo.naturalWidth / photo.naturalHeight);
    })).toBeLessThan(.005);
  }
  await expect(page.getByRole("heading", { name: "Your Ideas, Our Customization." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Style, Your Royale." })).toBeVisible();
  const start = page.getByRole("link", { name: "Get Started", exact: true });
  await start.scrollIntoViewIfNeeded();
  await expect(start).toHaveAttribute("href", "/shop/");
  await expect(page.getByRole("link", { name: "Sign In", exact: true })).toHaveAttribute("href", "/login/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await mkdir(".sites-runtime/screenshots", { recursive: true });
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
  await page.screenshot({ path: `.sites-runtime/screenshots/welcome-${isMobile ? "mobile" : "desktop"}.png`, fullPage: true });
  await start.click();
  await expect(page.getByRole("textbox", { name: "Search products", exact: true })).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Email address", exact: true })).toBeVisible();
});

test("landing page fits phone, tablet and desktop widths with readable touch controls", async ({ page, isMobile }) => {
  test.setTimeout(60000);
  test.skip(!isMobile, "Viewport checks run once across phone, tablet and desktop sizes.");
  await page.route("https://gangouwtzbymjlmlumiu.supabase.co/**", route => route.fulfill({ status: 404, contentType: "application/json", body: "{}" }));
  await page.goto("/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const selector of [".intro-start-button", ".intro-signin", ".intro-scroll"]) {
      const control = page.locator(selector);
      await control.scrollIntoViewIfNeeded();
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
  }
});
