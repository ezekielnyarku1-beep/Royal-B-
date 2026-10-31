import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/store_products*', route => route.fulfill({ status: 404, json: {} }));
});

test('shop loads twelve at a time and resets pagination for filters and searches', async ({ page }) => {
  await page.goto('/shop/');
  await expect(page.locator('.product-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Show more', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(24);
  await page.getByRole('group', { name: 'Filter products by category' }).getByRole('button', { name: 'Watches', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(12);
  await page.getByRole('textbox', { name: 'Search products', exact: true }).fill('Rose Tone Black Dial Watch');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-price')).toContainText('From GH');
  await expect(page.locator('.product-card .availability')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search products', exact: true }).fill('Water Bottles');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.locator('.collection-count')).toContainText('0 products');
  await expect(page.locator('.category-grid')).not.toContainText('Bottles');
  await expect(page.locator('.collection-filters')).not.toContainText('Diaries');
});

test('home and shop fit the viewport, support reduced motion and pass accessibility checks', async ({ page }, testInfo) => {
  for (const path of ['/', '/shop/', '/login/']) {
    await page.goto(path);
    await expect(page.locator(path === '/login/' ? '.auth-heading h2' : 'h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const issues = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
    expect(issues.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
    if (path === '/') await page.screenshot({path: `test-results/royal-home-${testInfo.project.name}.png`, fullPage: true});
    if (path === '/shop/') {
      await page.locator('#collection').scrollIntoViewIfNeeded();
      await page.screenshot({path: `test-results/royal-shop-${testInfo.project.name}.png`});
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('home category links select real products in the shop', async ({ page }) => {
  await page.goto('/');
  await page.locator('.intro-category-row').getByRole('link', { name: 'Watches' }).click();
  await expect(page.locator('.collection-filters button[aria-pressed="true"]')).toHaveText('Watches');
  await expect(page.locator('.product-card').first()).toBeVisible();
});
