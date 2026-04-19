import { test, expect } from '@playwright/test';
import { resetDb, login, SUPER, ADMIN } from './helpers';

test.beforeEach(() => resetDb());

test('super sees Admins link; regular does not', async ({ page, context }) => {
    await login(page, SUPER.email, SUPER.password);
    await expect(page.getByRole('link', { name: 'Admins' })).toBeVisible();

    await context.clearCookies();
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page.getByRole('link', { name: 'Admins' })).not.toBeVisible();
});

test('regular admin direct navigating /admins sees forbidden', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto('/admins');
    await expect(page.getByText(/don't have permission/i)).toBeVisible();
});

test('super creates an admin', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/admins');
    await page.click('text=Create admin');
    await page.fill('input[type="text"]', 'New User');
    await page.fill('input[type="email"]', 'newuser@e2e.test');
    await page.fill('input[type="password"]', 'aBcDefGh1234');
    await page.click('button:has-text("Create")');
    await expect(page.getByText('newuser@e2e.test')).toBeVisible();
});

test('delete last super admin blocked', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/admins');
    const superRow = page.locator('tr', { hasText: SUPER.email });
    await superRow.getByRole('button', { name: 'Delete' }).click();
    await page.click('button:has-text("Delete")');
    await expect(page.getByRole('alert')).toContainText(/cannot/i);
});
