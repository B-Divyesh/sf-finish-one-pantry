import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function openDemo(page: Page) {
  await page.goto('/demo/');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oat milk', level: 3 })).toBeVisible();
}

test('loads an isolated, populated sample and leaves real pantry data alone @claim:demo-sandbox', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add your first package' }).click();
  await page.getByLabel('Item name').fill('Real lentils');
  await page.getByRole('button', { name: 'Add to shelf' }).click();
  await expect(page.getByRole('heading', { name: 'Real lentils', level: 3 })).toBeVisible();

  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: 'Laundry detergent', level: 3 })).toBeVisible();
  await expect(page.getByText('On the shopping list')).toBeVisible();
  await page.getByRole('button', { name: 'Finish one Oat milk' }).click();
  await expect(page.getByText(/Oat milk: about 1 left/)).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.waitForURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Real lentils', level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oat milk', level: 3 })).toHaveCount(0);
});

test('adds a finished package to the shopping list at its chosen point @claim:list-at-threshold', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Finish one Oat milk' }).click();
  await expect(page.getByText('Added to the shopping list.')).toBeVisible();
  await page.getByRole('button', { name: /Shopping list/ }).click();
  await expect(page.getByRole('button', { name: 'Mark Oat milk as bought' })).toBeVisible();
});

test('records a purchase and clears that package from the shopping list @claim:purchase-reconciliation', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Finish one Oat milk' }).click();
  await page.getByRole('button', { name: /Shopping list/ }).click();
  await page.getByRole('button', { name: 'Mark Oat milk as bought' }).click();
  await page.getByLabel('Packages bought').fill('2');
  await page.getByRole('button', { name: 'Save as bought' }).click();
  await expect(page.getByRole('button', { name: 'Mark Oat milk as bought' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Shelf' }).click();
  await expect(page.getByLabel('Oat milk: about 3 sealed packages left')).toBeVisible();
});

test('corrects a missed count and undoes a finish event @claim:corrections-and-undo', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Add one Basmati rice package' }).click();
  await expect(page.getByLabel('Basmati rice: about 5 sealed packages left')).toBeVisible();
  await page.getByRole('button', { name: 'Finish one Oat milk' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByLabel('Oat milk: about 2 sealed packages left')).toBeVisible();
});

test('keeps sample changes after a browser reload @claim:local-save', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Finish one Oat milk' }).click();
  await page.reload();
  await expect(page.getByLabel('Oat milk: about 1 sealed package left')).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
});

test('works offline after the first visit with sample data @claim:offline-reload', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/demo/');
    await expect(page.getByRole('heading', { name: 'Oat milk', level: 3 })).toBeVisible();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Offline.')).toBeVisible();
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Basmati rice', level: 3 })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('downloads a JSON backup with the current sample records @claim:json-backup', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Data and help' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const payload = JSON.parse(await readFile(path!, 'utf8'));
  expect(payload.product).toBe('finish-one-pantry');
  expect(payload.items.map((item: { name: string }) => item.name)).toEqual(expect.arrayContaining(['Oat milk', 'Basmati rice', 'Laundry detergent', 'Coffee beans']));
});

test('rejects an invalid backup without replacing the sample @claim:backup-validation', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Data and help' }).click();
  await page.locator('#import-file').setInputFiles({ name: 'not-a-backup.json', mimeType: 'application/json', buffer: Buffer.from('{"items":[]}') });
  await expect(page.getByText('That file is not a supported Finish One Pantry export.')).toBeVisible();
  await page.getByRole('button', { name: 'Shelf' }).click();
  await expect(page.getByRole('heading', { name: 'Coffee beans', level: 3 })).toBeVisible();
});

test('publishes an installable standalone web app manifest @claim:installable-app', async ({ page }) => {
  await openDemo(page);
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const response = await fetch(link?.href ?? '');
    return { linked: Boolean(link), ok: response.ok, json: await response.json() };
  });
  expect(manifest.linked).toBe(true);
  expect(manifest.ok).toBe(true);
  expect(manifest.json.display).toBe('standalone');
  expect(manifest.json.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192' }),
    expect.objectContaining({ sizes: '512x512' })
  ]));
});

test('sends no demo pantry data to another origin @claim:local-private', async ({ page, baseURL }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await openDemo(page);
  await page.getByRole('button', { name: 'Finish one Oat milk' }).click();
  await page.getByRole('button', { name: 'Data and help' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  await downloadPromise;
  const origin = new URL(baseURL ?? 'http://127.0.0.1:4173').origin;
  expect(requested.filter((url) => url.startsWith('http'))).not.toHaveLength(0);
  expect(requested.filter((url) => url.startsWith('http')).every((url) => new URL(url).origin === origin)).toBe(true);
});

test('keeps the normal pantry path usable with keyboard and bounds checks', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add your first package' });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Item name')).toBeFocused();
  await page.keyboard.type('Tea');
  await page.getByLabel('About how many are left?').fill('100');
  await page.getByRole('button', { name: 'Add to shelf' }).click();
  await expect(page.getByLabel('Item name')).toBeVisible();
  await page.getByLabel('About how many are left?').fill('2');
  await page.getByRole('button', { name: 'Add to shelf' }).click();
  await page.getByRole('button', { name: 'Finish one Tea' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Tea: about 1 left/)).toBeVisible();
});

test('keeps the pantry usable when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }));
  await page.goto('/');
  await expect(page.getByText('Temporary notebook:')).toBeVisible();
  await page.getByRole('button', { name: 'Add your first package' }).click();
  await page.getByLabel('Item name').fill('Emergency tea');
  await page.getByRole('button', { name: 'Add to shelf' }).click();
  await expect(page.getByRole('heading', { name: 'Emergency tea', level: 3 })).toBeVisible();
});

test('shows an update action when a new worker is waiting', async ({ page }) => {
  await page.addInitScript(() => {
    const waiting = { postMessage: (message: unknown) => document.documentElement.setAttribute('data-update-message', JSON.stringify(message)) };
    const registration = { waiting, addEventListener: () => undefined };
    const service = { controller: {}, register: async () => registration, addEventListener: () => undefined };
    Object.defineProperty(navigator, 'serviceWorker', { value: service, configurable: true });
  });
  await page.goto('/');
  await expect(page.getByText('An update is ready.')).toBeVisible();
  await page.getByRole('button', { name: 'Update now' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-update-message', '{"type":"SKIP_WAITING"}');
});

test('uses route titles, an accessible 404 page, and no serious accessibility violations', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Finish One Pantry');
  await expect(page.getByRole('heading', { name: 'Privacy', level: 1 })).toBeVisible();
  await page.goto('/does-not-exist');
  await expect(page).toHaveTitle('Page not found — Finish One Pantry');
  await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible();
  await openDemo(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
