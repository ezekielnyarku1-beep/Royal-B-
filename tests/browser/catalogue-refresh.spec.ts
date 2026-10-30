import { test, expect } from '@playwright/test';
import { products } from '../../src/lib/catalogue';

const endpoint = '**/rest/v1/store_products*';
const row = (details: typeof products[number]) => ({ id: details.id, details, active: true, stock_status: 'confirm', stock_quantity: null });

test('live-only products survive bag restoration and removed products cannot crash checkout', async ({ page }) => {
  const product = { ...products[0], id: 'live-only-bracelet', name: 'Live Bracelet' };
  let rows = [row(product)];
  await page.route(endpoint, async route => { await new Promise(resolve => setTimeout(resolve, 250)); await route.fulfill({ json: rows }); });
  await page.addInitScript(() => localStorage.setItem('bbr-shopping-bag-v1', JSON.stringify([{ productId: 'live-only-bracelet', quantity: 2, customization: 'Ama' }])));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/shop/');
  await expect(page.locator('.product-card h3')).toHaveText(['Live Bracelet']);
  await page.getByRole('button', { name: 'Open shopping bag, 2 items', exact: true }).click();
  await expect(page.locator('.cart-item h3')).toHaveText(['Live Bracelet']);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('bbr-shopping-bag-v1')!)[0]?.productId)).toBe('live-only-bracelet');
  rows = [];
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('Your bag is empty.', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('open product price follows catalogue refresh and keeps customer preferences', async ({ page }) => {
  let product = { ...products[0], priceGhs: 130 };
  await page.route(endpoint, route => route.fulfill({ json: [row(product)] }));
  await page.goto('/shop/');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('button', { name: `Choose options for ${product.name}`, exact: true }).click();
  await page.locator('#product-customization').fill('Ama');
  product = { ...product, priceGhs: 175 };
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.detail-price')).toContainText('175');
  await expect(page.locator('#product-customization')).toHaveValue('Ama');
  await page.getByRole('button', { name: 'Add to bag', exact: true }).click();
  await page.getByRole('button', { name: 'Open shopping bag, 1 item', exact: true }).click();
  const draft = await page.getByRole('link', { name: 'Continue on WhatsApp', exact: true }).getAttribute('href');
  expect(new URL(draft!).searchParams.get('text')).toContain('175.00');
});

test('phone search shortcut focuses search and help is accessible', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone navigation only');
  await page.goto('/shop/');
  await page.getByRole('navigation', { name: 'Mobile shopping', exact: true }).getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search products', exact: true })).toBeFocused();
  await page.locator('#shopping-help summary').filter({ hasText: 'Delivery and preparation' }).click();
  await expect(page.locator('#shopping-help details[open]')).toContainText('town or city');
});
