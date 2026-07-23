import { expect, test } from '@playwright/test';

test('home page presents Mezgeb and opens the integrated app', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your business/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Mezgeb app' }).first()).toBeVisible();
});

test('native Mezgeb app is available inside the website', async ({ page }, testInfo) => {
  await page.goto('/app');

  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('.mezgebAppIdentity')).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { name: /business workspace/i })).toBeVisible();
  }

  await expect(page.getByRole('navigation', { name: 'Mezgeb application navigation' })).toBeVisible();
  await expect(page.getByText('Net balance')).toBeVisible();

  await page.getByRole('button', { name: 'Ledger' }).click();
  await expect(page.getByRole('heading', { name: 'Record a transaction' })).toBeVisible();
});

test('mobile app fills the phone viewport and uses bottom navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile layout verification');

  await page.goto('/app');
  await expect(page.locator('.siteHeader')).toBeHidden();
  await expect(page.locator('.siteFooter')).toBeHidden();

  const shell = page.locator('.nativeAppShell');
  await expect(shell).toBeVisible();

  const shellBox = await shell.boundingBox();
  const viewport = page.viewportSize();
  expect(shellBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(shellBox?.x ?? 99).toBeLessThanOrEqual(1);
  expect(Math.abs((shellBox?.width ?? 0) - (viewport?.width ?? 0))).toBeLessThanOrEqual(2);

  const navigation = page.getByRole('navigation', { name: 'Mezgeb application navigation' });
  await expect(navigation).toHaveCSS('position', 'fixed');

  await page.getByRole('button', { name: 'Receipts' }).click();
  await expect(page.getByRole('heading', { name: 'Receipt history' })).toBeVisible();
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

test('authentication and password recovery pages are available', async ({ page }) => {
  await page.goto('/auth/sign-up');
  await expect(page.getByRole('heading', { name: /secure business record/i })).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Confirm password')).toBeVisible();

  await page.goto('/auth/forgot-password');
  await expect(page.getByRole('heading', { name: /Reset your Mezgeb password/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Send password-reset link/i })).toBeVisible();
});

test('dashboard redirects signed-out visitors to authentication', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard/);
  await expect(page.getByRole('heading', { name: /Welcome back to Mezgeb/i })).toBeVisible();
});

test('quick demo is explicitly labeled', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Sample data only')).toBeVisible();
});
