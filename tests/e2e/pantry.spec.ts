import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('adds, finishes, lists, and replenishes a repeat package', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Finish One Pantry', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /add your first item/i }).click();
  await page.getByLabel('Item name').fill('Oat milk');
  await page.getByLabel('About how many are left?').fill('2');
  await page.getByLabel('Add to list when this many are left').fill('1');
  await page.getByRole('button', { name: 'Pin to shelf' }).click();

  await expect(page.getByRole('heading', { name: 'Oat milk', level: 3 })).toBeVisible();
  await page.getByRole('button', { name: 'Finish one' }).click();
  await expect(page.getByText(/Oat milk: about 1 left.*Added to the shopping list/)).toBeVisible();

  await page.getByRole('button', { name: /List/ }).click();
  await expect(page.getByRole('button', { name: /Mark Oat milk as bought/ })).toBeVisible();
  await page.getByRole('button', { name: /Mark Oat milk as bought/ }).click();
  await page.getByLabel('Packages bought').fill('2');
  await page.getByRole('button', { name: 'Save as bought' }).click();
  await expect(page.getByRole('heading', { name: 'Nothing needs replacing.' })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: /Shelf/ }).click();
  await expect(page.getByLabel('About 3 sealed packages left')).toBeVisible();
});

test('supports undo after a finish event', async ({ page }) => {
  await page.getByRole('button', { name: /add your first item/i }).click();
  await page.getByLabel('Item name').fill('Rice');
  await page.getByLabel('About how many are left?').fill('3');
  await page.getByRole('button', { name: 'Pin to shelf' }).click();
  await page.getByRole('button', { name: 'Finish one' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByLabel('About 3 sealed packages left')).toBeVisible();
});

test('operates the primary path from the keyboard', async ({ page }) => {
  const addButton = page.getByRole('button', { name: /add your first item/i });
  await addButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Item name')).toBeFocused();
  await page.keyboard.type('Tea');
  const saveButton = page.getByRole('button', { name: 'Pin to shelf' });
  await saveButton.focus();
  await page.keyboard.press('Space');
  const finishButton = page.getByRole('button', { name: 'Finish one' });
  await finishButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Tea: about 1 left/)).toBeVisible();
});

test('has no serious accessibility violations on core screens', async ({ page }, testInfo) => {
  const emptyResults = await new AxeBuilder({ page }).analyze();
  expect(emptyResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.getByRole('button', { name: /add your first item/i }).click();
  await page.getByLabel('Item name').fill('Detergent');
  await page.getByRole('button', { name: 'Pin to shelf' }).click();
  const shelfResults = await new AxeBuilder({ page }).analyze();
  expect(shelfResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), testInfo.project.name).toEqual([]);
});

test('reopens the pantry while fully offline', async ({ page, context }) => {
  await page.getByRole('button', { name: /add your first item/i }).click();
  await page.getByLabel('Item name').fill('Coffee');
  await page.getByRole('button', { name: 'Pin to shelf' }).click();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cachedUrls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (name) => (await (await caches.open(name)).keys()).map((request) => request.url)))).flat());
  expect(cachedUrls.some((url) => /\/assets\/main-.*\.js$/.test(url)), `cached URLs: ${cachedUrls.join(', ')}`).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Coffee', level: 3 })).toBeVisible();
  await page.getByRole('button', { name: 'Finish one' }).click();
  await expect(page.getByText(/Coffee: about 1 left/)).toBeVisible();
});

test('serves privacy and terms as standalone accessible routes', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { name: 'Your pantry stays yours.', level: 1 })).toBeVisible();
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { name: 'A small, honest utility.', level: 1 })).toBeVisible();
});
