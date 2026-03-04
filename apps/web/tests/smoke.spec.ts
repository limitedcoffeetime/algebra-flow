import { expect, test } from '@playwright/test';

test('web shell and key routes render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Algebra Flow' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Primary' });

  await nav.getByRole('link', { name: 'Practice' }).click();
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();

  await nav.getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();

  await nav.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});
