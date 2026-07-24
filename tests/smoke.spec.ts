import { expect, test } from '@playwright/test';

const releaseCopy = 'Persistent ledger, Dube, receipts, reports, onboarding and four-tier ETB pricing are connected.';

test('professional homepage presents Mezgeb and a clear account funnel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Run the business/i })).toBeVisible();
  await expect(page.getByText('Business management, built for Ethiopia')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Start 14-day trial' }).first()).toBeVisible();
  await expect(page.getByText('Persistent ledger, Dube, receipts, reports, onboarding and four-tier ETB pricing are connected.')).toBeVisible();
  await expect(page.getByText('Business management, built for Ethiopia')).toHaveCount(0);
  const presenter = page.getByRole('img', { name: /Ethiopian woman/i });
  await expect(presenter).toBeVisible();
  await expect(presenter).toHaveAttribute('src', /mezgeb-presenter/);
  await expect(presenter).toHaveAttribute('width', '600');
  const staticAsset = await page.request.get('/images/mezgeb-presenter.webp');
  expect(staticAsset.ok()).toBe(true);
  expect(staticAsset.headers()['content-type']).toContain('image/webp');
  expect(Number(staticAsset.headers()['content-length'] ?? 0)).toBeGreaterThan(12_000);
  await expect(page.getByLabel('Mezgeb dashboard product preview')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Local business reality is not an add-on/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Your business deserves more than scattered notes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join product updates' })).toBeVisible();
  await expect(page.getByText('Powered by')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hisabtech.com' })).toHaveAttribute('href', 'https://hisabtech.com');
});

test('release announcement remains visible on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Desktop release announcement verification');
  await page.goto('/');
  await expect(page.getByText(releaseCopy)).toBeVisible();
  await expect(page.getByRole('link', { name: /Start the Starter trial/i })).toBeVisible();
});

test('marketing homepage fits the mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile marketing verification');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Run the business/i })).toBeVisible();
  await expect(page.getByText(releaseCopy)).toBeHidden();
  await expect(page.getByText('Business management, built for Ethiopia')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /Ethiopian woman/i })).toBeVisible();
  await expect(page.getByText('Persistent ledger, Dube, receipts, reports, onboarding and four-tier ETB pricing are connected.')).toBeHidden();
  await expect(page.getByText('Business management, built for Ethiopia')).toHaveCount(0);
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.getByRole('link', { name: /Explore the mobile app/i })).toBeVisible();
});

test('pricing loads four ETB tiers and supports annual selection', async ({ page }) => {
  await page.goto('/#pricing');
  await expect(page.getByRole('heading', { name: /Choose the operating level/i })).toBeVisible();
  await expect(page.getByText('ETB 1,500').first()).toBeVisible();
  await expect(page.getByText('ETB 4,500').first()).toBeVisible();
  await expect(page.getByText('ETB 9,500').first()).toBeVisible();
  await expect(page.getByText('Custom').first()).toBeVisible();
  await page.getByRole('button', { name: /Yearly/i }).click();
  await expect(page.getByText('ETB 15,000').first()).toBeVisible();
  await expect(page.getByText('ETB 45,000').first()).toBeVisible();
  await expect(page.getByText('ETB 95,000').first()).toBeVisible();
  await page.getByRole('button', { name: /Start 14-day trial/i }).first().click();
  await expect(page).toHaveURL(/\/auth\/sign-up\?next=%2Fdashboard/);
});

test('pricing text stays inside every visible card', async ({ page }) => {
  await page.goto('/#pricing');
  const cards = page.locator('section[id="pricing"] article');
  await expect(cards).toHaveCount(4);
  const clippedText = await cards.evaluateAll((elements) => elements.flatMap((element) =>
    Array.from(element.querySelectorAll('h3,p,li')).map((textElement) => textElement.scrollWidth > textElement.clientWidth + 1)
  ));
  expect(clippedText.every((clipped) => !clipped)).toBe(true);
});

test('production workspace requires an authenticated account', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fapp/);
  await expect(page.getByRole('heading', { name: /Welcome back to Mezgeb/i })).toBeVisible();
});

test('business onboarding is protected by authentication', async ({ page }) => {
  await page.goto('/onboarding');
  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fonboarding/);
  await expect(page.getByRole('heading', { name: /Welcome back to Mezgeb/i })).toBeVisible();
});

test('Ethiopian registration is moderate and uses a two-step identity flow', async ({ page }) => {
  await page.goto('/auth/sign-up');
  await expect(page.getByRole('heading', { name: /secure business record/i })).toBeVisible();
  await expect(page.getByLabel('Full legal name')).toBeVisible();
  await expect(page.getByLabel('Ethiopian mobile number')).toBeVisible();
  await expect(page.getByLabel('Region / city administration')).toBeVisible();
  await expect(page.getByLabel('City, sub-city, zone, or woreda')).toBeVisible();
  await expect(page.getByLabel('Preferred language')).toBeVisible();
  await expect(page.getByLabel('Your role')).toBeVisible();
  await page.getByLabel('Full legal name').fill('Test Ethiopian User');
  await page.getByLabel('Ethiopian mobile number').fill('0911234567');
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Region / city administration').selectOption('Addis Ababa');
  await page.getByLabel('City, sub-city, zone, or woreda').fill('Bole');
  await page.getByRole('button', { name: 'Continue to security' }).click();
  await expect(page.getByLabel('Ethiopian ID type')).toBeVisible();
  await expect(page.getByLabel('12-digit Fayda number')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Confirm password')).toBeVisible();
  await expect(page.getByText(/complete document number is not stored/i)).toBeVisible();

  await page.goto('/auth/forgot-password');
  await expect(page.getByRole('heading', { name: /Reset your Mezgeb password/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Send password-reset link/i })).toBeVisible();
});

test('post-registration page requires confirmation and preserves the selected plan return', async ({ page }) => {
  await page.goto('/auth/check-email?email=newuser%40example.com&next=%2Fdashboard');
  await expect(page.getByRole('heading', { name: /Check your email/i })).toBeVisible();
  await expect(page.getByText('newuser@example.com').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Resend confirmation email/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /I confirmed my email/i })).toHaveAttribute('href', /next=%2Fdashboard/);
});

test('dashboard redirects signed-out visitors to authentication', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard/);
  await expect(page.getByRole('heading', { name: /Welcome back to Mezgeb/i })).toBeVisible();
});

test('quick demo remains public and explicitly labeled', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Sample data only')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Try Mezgeb/i })).toBeVisible();
});