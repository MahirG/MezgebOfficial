import { expect, test } from '@playwright/test';

test('home page presents Mezgeb clearly', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your business/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try the interactive demo' })).toBeVisible();
});

test('demo is explicitly labeled', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Sample data only')).toBeVisible();
});
