import { expect, test } from '@playwright/test';

test('home page presents Mezgeb and opens the integrated app', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your business/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Mezgeb app' }).first()).toBeVisible();
});

test('native Mezgeb app is available inside the website', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: /business workspace/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mezgeb application navigation' })).toBeVisible();
  await expect(page.getByText('Net balance')).toBeVisible();

  await page.getByRole('button', { name: 'Ledger' }).click();
  await expect(page.getByRole('heading', { name: 'Record a transaction' })).toBeVisible();
});

test('native app records a local sample transaction', async ({ page }) => {
  await page.goto('/app');
  await page.getByRole('button', { name: 'Add sale' }).click();
  await page.getByLabel('Description').fill('Test coffee sale');
  await page.getByLabel('Amount in ETB').fill('250');
  await page.getByRole('button', { name: 'Save sale' }).click();
  await expect(page.getByText('Sale recorded successfully.')).toBeVisible();
  await expect(page.getByText('Test coffee sale')).toBeVisible();
});

test('quick demo is explicitly labeled', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Sample data only')).toBeVisible();
});
