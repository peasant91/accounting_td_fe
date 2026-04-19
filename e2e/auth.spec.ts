import { test, expect } from '@playwright/test';
import { resetDb, login, SUPER } from './helpers';

test.beforeAll(() => resetDb());

test('unauth visit redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
});

test('valid login lands on dashboard', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});

test('wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', SUPER.email);
    await page.fill('input#password', 'wrong-password');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('alert')).toContainText(/invalid/i);
    await expect(page).toHaveURL(/\/login/);
});

test('6 bad attempts yields rate limit', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
        await page.goto('/login');
        await page.fill('input#email', 'lockme@e2e.test');
        await page.fill('input#password', 'nope');
        await page.click('button[type="submit"]');
    }
    await expect(page.getByRole('alert')).toContainText(/too many/i);
});

test('logout ends session', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.getByRole('button', { name: SUPER.email.split('@')[0] }).click().catch(() => {});
    await page.click('text=Sign out');
    await expect(page).toHaveURL(/\/login/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
});
