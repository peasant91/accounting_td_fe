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
    await page.getByRole('button', { name: 'Create admin' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input#admin-name').fill('New User');
    await dialog.locator('input#admin-email').fill('newuser@e2e.test');
    await dialog.locator('input#admin-password').fill('aBcDefGh1234');
    await dialog.getByRole('button', { name: /^Create$/ }).click();
    await expect(page.getByText('newuser@e2e.test')).toBeVisible();
});

test('delete last super admin blocked', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/admins');
    const superRow = page.locator('tr', { hasText: SUPER.email });
    await superRow.getByRole('button', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Delete$/ }).click();
    await expect(dialog.locator('p[role="alert"]')).toContainText(/cannot/i);
});
