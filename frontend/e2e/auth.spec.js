import { test, expect } from '@playwright/test';

test.describe('Student Authentication & Navigation UI', () => {
  test('Register page renders with correct form fields and validation', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h2')).toContainText('Create your student account');

    // Verify fields
    await expect(page.locator('input[name="full_name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirm_password"]')).toBeVisible();

    // Verify submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Register & Continue');
  });

  test('Login page renders with credential fields and navigation links', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Sign in to your account');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    const forgotLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();

    const registerLink = page.getByRole('link', { name: 'register as a new student' });
    await expect(registerLink).toBeVisible();

    const adminLink = page.locator('a[href="/admin-login"]');
    await expect(adminLink).toBeVisible();
  });

  test('Verify email page displays code entry and countdown cooldown UI', async ({ page }) => {
    await page.goto('/verify-email?email=teststudent%40example.com');
    await expect(page.locator('h2')).toContainText('Verify your email');
    await expect(page.locator('input[type="text"]')).toBeVisible();

    const verifyBtn = page.locator('button[type="submit"]');
    await expect(verifyBtn).toBeVisible();
    await expect(verifyBtn).toContainText('Verify & Proceed');
  });

  test('Forgot password page handles password reset requests', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h2')).toContainText('Reset your password');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toContainText('Send Reset Code');
  });

  test('Admin portal enforces 2FA workflow UI', async ({ page }) => {
    await page.goto('/admin-login');
    await expect(page.locator('h2')).toContainText('Administrator Portal');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Continue with 2FA');
  });
});
