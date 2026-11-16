import { test, expect } from '@playwright/test';

test.describe('Phase 2 — Dashboard and Navigation Shell', () => {
  test('Dashboard renders hero, 3 core pillars, continue learning, and recent activity', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Interview Preparation Platform');

    // 3 Equal Pillars
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Practice', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Share Experience', exact: true })).toBeVisible();

    // Continue Learning empty state for guest/new user
    await expect(page.getByRole('heading', { name: 'Continue Learning' })).toBeVisible();
    await expect(page.getByText('No active roadmap yet')).toBeVisible();

    // Recent Activity empty state
    await expect(page.getByRole('heading', { name: 'Recent Activity', exact: true })).toBeVisible();
    await expect(page.getByText('No recent activity yet')).toBeVisible();

    // Quick Shortcuts
    await expect(page.getByRole('heading', { name: 'Quick Shortcuts' })).toBeVisible();
  });

  test('Learn module entry page renders correctly with Phase 3 status and wizard preview', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.locator('h1')).toContainText('Learn — Personalized Technical Roadmaps');
    await expect(page.getByText('Module Status: Phase 3 Foundation In Progress')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Roadmap Setup Wizard (Preview)' })).toBeVisible();
    await expect(page.getByText('Step 1')).toBeVisible();
    await expect(page.getByText('Step 5')).toBeVisible();
  });

  test('Practice module entry page renders with Phase 6 & 7 status and 2 core tracks', async ({ page }) => {
    await page.goto('/practice');
    await expect(page.locator('h1')).toContainText('Practice — AI Voice Interviews & Aptitude');
    await expect(page.getByText('Module Status: Scheduled for Phases 6 & 7')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Track 1: AI Voice Simulation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Track 2: Fresher Aptitude Practice' })).toBeVisible();
  });

  test('Share Experience module entry page renders with Phase 8 status and discovery taxonomy', async ({ page }) => {
    await page.goto('/experiences');
    await expect(page.locator('h1')).toContainText('Share Interview Experience — Peer Intelligence');
    await expect(page.getByText('Module Status: Scheduled for Phase 8')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Risk-Based Auto Moderation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Discovery Taxonomy (Preview)' })).toBeVisible();
  });

  test('Desktop navigation links allow seamless module transitions and highlight active states', async ({ page }) => {
    await page.goto('/dashboard');

    // Click Learn nav link
    const learnLink = page.locator('nav').getByRole('link', { name: 'Learn' });
    await learnLink.click();
    await expect(page).toHaveURL(/\/learn$/);
    await expect(learnLink).toHaveClass(/bg-brand-50/);

    // Click Practice nav link
    const practiceLink = page.locator('nav').getByRole('link', { name: 'Practice' });
    await practiceLink.click();
    await expect(page).toHaveURL(/\/practice$/);
    await expect(practiceLink).toHaveClass(/bg-brand-50/);

    // Click Share Experience nav link
    const expLink = page.locator('nav').getByRole('link', { name: 'Share Experience' });
    await expLink.click();
    await expect(page).toHaveURL(/\/experiences$/);
    await expect(expLink).toHaveClass(/bg-brand-50/);

    // Click Dashboard logo link to return
    await page.locator('nav a[href="/dashboard"]').first().click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Mobile navigation hamburger toggles menu on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    const hamburgerBtn = page.locator('button[aria-label="Toggle navigation menu"]');
    await expect(hamburgerBtn).toBeVisible();

    // Open mobile menu
    await hamburgerBtn.click();
    const mobileLearnLink = page.locator('nav .md\\:hidden').getByRole('link', { name: 'Learn' });
    await expect(mobileLearnLink).toBeVisible();

    // Navigate to Learn via mobile menu
    await mobileLearnLink.click();
    await expect(page).toHaveURL(/\/learn$/);
  });

  test('Protected route redirects unauthenticated user from /profile to /login with state', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('h2')).toContainText('Sign in to your account');
  });
});
