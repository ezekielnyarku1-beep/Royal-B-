import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/store_products*', route => route.fulfill({ status: 404, json: {} }));
});

test('one slim navigation works across every public page', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [path, active] of [['/', 'Home'], ['/shop/', 'Shopping'], ['/about/', 'About'], ['/login/', 'Account'], ['/account/', 'Account']]) {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
    await expect(nav.getByRole('link')).toHaveText(['Home', 'Shopping', 'Account', 'About']);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(active);
    await expect(nav.getByRole('link', { name: 'Account', exact: true })).toHaveAttribute('href', '/login/');
    await expect(page.locator('.site-header')).toHaveCount(1);
    expect(await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(70);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    if (path === '/shop/' || path === '/about/') await page.screenshot({ path: `test-results/header-${active}-${testInfo.project.name}.png`, fullPage: path === '/about/' });
  }
  if (testInfo.project.name === 'mobile') {
    for (const width of [320, 768, 820]) {
      await page.setViewportSize({ width, height: 650 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 320, height: 650 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const link of await page.locator('.site-main-nav a').all()) {
      const box = await link.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('bag counts update immediately and the bag opens from other pages', async ({ page }) => {
  await page.goto('/shop/');
  await page.getByRole('button', { name: 'Choose options for Customized Bracelets', exact: true }).click();
  await page.getByRole('button', { name: 'Add to bag', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open shopping bag, 1 item', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about\//);
  await expect(page.locator('.site-main-nav [aria-current="page"]')).toHaveText('About');
  await page.getByRole('button', { name: 'Open shopping bag, 1 item', exact: true }).click();
  await expect(page).toHaveURL(/\/shop\/\?bag=open/);
  const bag = page.getByRole('dialog', { name: /^Your bag/ });
  await expect(bag).toBeVisible();
  await expect(bag.locator('.cart-item')).toHaveCount(1);
  await bag.getByRole('button', { name: /Remove Customized Bracelets/ }).click();
  await bag.getByRole('button', { name: /Close shopping bag/ }).click();
  await expect(page.getByRole('button', { name: 'Open shopping bag, 0 items', exact: true })).toBeVisible();
});

test('search, grouped categories and ordering information are reachable in their new homes', async ({ page }) => {
  await page.goto('/shop/');
  await expect(page.locator('.site-header').getByRole('search')).toHaveCount(0);
  await expect(page.locator('main').getByRole('search')).toBeVisible();
  await expect(page.locator('main .store-announcement')).toHaveText('Shop online. Confirm your order on WhatsApp.');
  const filters = page.getByRole('group', { name: 'Filter products by category' });
  await filters.getByRole('button', { name: 'Personalised gifts', exact: true }).click();
  await expect(page.locator('.collection-count')).toContainText('Personalised gifts');
  await filters.getByRole('button', { name: 'Home & living', exact: true }).click();
  await expect(page.locator('.collection-count')).toContainText('Home & living');
  await page.locator('footer').getByRole('link', { name: 'How to order', exact: true }).click();
  await expect(page).toHaveURL(/\/about\/#how-to-order/);
  await expect(page.getByRole('heading', { name: 'How to order', exact: true })).toBeInViewport();
  await expect(page.locator('.about-portraits img')).toHaveCount(3);
});
