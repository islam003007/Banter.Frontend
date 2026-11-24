import { expect, test, type Page } from '@playwright/test';

async function loginAsAhmed(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue as Ahmed' }).click();
  await expect(page).toHaveURL(/\/inbox$/);
  await expect(page.getByRole('heading', { name: 'Ahmed.' })).toBeVisible();
}

test.describe('banter smoke', () => {
  test('signs in through the demo roster and opens the inbox', async ({ page }) => {
    await loginAsAhmed(page);

    const rail = page.getByRole('navigation', { name: 'Channels' });
    await expect(rail).toBeVisible();
    await expect(rail.getByRole('link').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pick up where you left off.' })).toBeVisible();
  });

  test('sends an optimistic message and keeps it after reload', async ({ page }) => {
    await loginAsAhmed(page);
    await page
      .getByRole('navigation', { name: 'Channels' })
      .getByRole('link', { name: /Mohamed/ })
      .click();
    await expect(page).toHaveURL(/\/c\//);

    await page.route('**/api/v1/conversations/*/messages', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      await route.continue();
    });

    const body = `E2E smoke ${Date.now()}`;
    const composer = page.getByRole('textbox', { name: /Message / });
    await composer.fill(body);
    await composer.press('Enter');

    const bubble = page.locator('.feed .message').getByText(body, { exact: true });
    await expect(bubble).toBeVisible();
    await expect(page.getByText('sending')).toBeVisible();
    await expect(composer).toHaveValue('');
    await expect(page.getByText('sending')).toHaveCount(0);

    await page.reload();
    await expect(bubble).toBeVisible();
  });

  test('starts a direct thread and opens channel details', async ({ page }) => {
    await loginAsAhmed(page);
    await page.goto('/new');

    const search = page.getByPlaceholder('Search by name or email');
    await search.fill('Sara');
    const result = page.locator('.search-result').filter({ hasText: 'Sara' }).first();
    await expect(result).toBeVisible();
    await result.click();

    const openDirect = page.getByRole('button', { name: 'Open direct channel' });
    await expect(openDirect).toBeEnabled();
    await openDirect.click();

    await expect(page).toHaveURL(/\/c\//);
    await expect(page.getByRole('textbox', { name: /Message / })).toBeVisible();

    await page.getByRole('button', { name: 'Channel details' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'People' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
