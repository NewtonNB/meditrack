import { test, expect } from '@playwright/test';

test('homepage redirects appropriately', async ({ page }) => {
  await page.goto('/');
  // Either login or dashboard depending on auth state
  await expect(page).toHaveURL(/(login|dashboard)/);
});


