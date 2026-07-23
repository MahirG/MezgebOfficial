import { expect, test } from '@playwright/test';

test('home page presents Mezgeb and opens the integrated app', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your business/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Mezgeb app' }).first()).toBeVisible();
});

test('complete Mezgeb app is available inside the website', async ({ page, request }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: /full Mezgeb experience/i })).toBeVisible();
  await expect(page.locator('iframe[title="Mezgeb application"]')).toBeVisible({ timeout: 20_000 });

  for (const part of [0, 1, 2, 3]) {
    const response = await request.get(`/mezgeb-app.part-${part}.txt`);
    expect(response.ok()).toBeTruthy();
    expect((await response.text()).length).toBeGreaterThan(10_000);
  }
});

test('quick demo is explicitly labeled', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Sample data only')).toBeVisible();
});
