import { Page, expect } from '@playwright/test';
import { execSync } from 'child_process';

export function resetDb() {
    execSync('cd ../backend && php artisan e2e:reset', { stdio: 'inherit' });
}

export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/\/login/);
}

export const SUPER = { email: 'super@e2e.test', password: 'super-password-12' };
export const ADMIN = { email: 'admin@e2e.test', password: 'admin-password-12' };
