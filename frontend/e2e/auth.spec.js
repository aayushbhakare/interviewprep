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

  test('Register page displays full human-readable validation message for weak or short passwords', async ({ page }) => {
    await page.goto('/register');

    // Fill in valid name & email, but short password (< 8 chars)
    await page.locator('input[name="full_name"]').fill('Aayush');
    await page.locator('input[name="email"]').fill('aayush@example.com');
    await page.locator('input[name="password"]').fill('pass');
    await page.locator('input[name="confirm_password"]').fill('pass');

    await page.locator('button[type="submit"]').click();

    // Verify full error message is shown, NOT just "P"
    const passwordError = page.locator('input[name="password"]').locator('..').locator('+ p');
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toHaveText('Password must be at least 8 characters long.');
    expect(await passwordError.textContent()).not.toBe('P');

    // Test mismatched passwords
    await page.locator('input[name="password"]').fill('ValidPassword123!');
    await page.locator('input[name="confirm_password"]').fill('DifferentPassword123!');
    await page.locator('button[type="submit"]').click();
    const confirmError = page.locator('input[name="confirm_password"]').locator('..').locator('+ p');
    await expect(confirmError).toBeVisible();
    await expect(confirmError).toHaveText('Passwords do not match.');
    expect(await confirmError.textContent()).not.toBe('P');
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
