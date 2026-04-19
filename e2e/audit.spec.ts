import { test, expect } from '@playwright/test';
import { resetDb, login, SUPER } from './helpers';

test.beforeAll(() => resetDb());

test('activity page shows auth.login row', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/audit');
    await expect(page.locator('text=auth.login').first()).toBeVisible();
});

test('filter by action', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/audit');
    await page.fill('input[placeholder*="invoice.created" i]', 'auth.login');
    await expect(page.locator('tbody tr').first()).toContainText('auth.login');
});

test('login attempts page shows failed row', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'nobody@e2e.test');
    await page.fill('input#password', 'bad');
    await page.click('button[type="submit"]');

    await login(page, SUPER.email, SUPER.password);
    await page.goto('/audit/login-attempts');
    await expect(page.locator('tr', { hasText: 'nobody@e2e.test' })).toBeVisible();
    await expect(page.locator('tr', { hasText: 'nobody@e2e.test' }).locator('text=FAIL')).toBeVisible();
});
