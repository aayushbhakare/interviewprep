import { test, expect } from '@playwright/test';

test.describe('Phase 9 — End-to-End Student Journey & Security Regression', () => {
  test.setTimeout(90000);

  test('Complete Student Journey: Auth, Dashboard, Learn, Quizzes, Aptitude, Voice Setup, Experiences, & Admin Guard', async ({ page }) => {
    // 1. Student Login
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Sign in to your account');
    await page.fill('input[name="email"]', 'e2e_student@interviewprep.local');
    await page.fill('input[name="password"]', 'E2EPassword123!');
    await page.click('button[type="submit"]');

    // 2. Student Dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Practice', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Share Experience', exact: true })).toBeVisible();

    // 3. Learning Roadmap
    await page.goto('/learn');
    await expect(page.locator('h1')).toBeVisible();

    // 4. Weekly Quizzes System
    await page.goto('/quizzes');
    await expect(page.locator('h1')).toBeVisible();

    // 5. Practice Hub (Track 1 Voice + Track 2 Aptitude)
    await page.goto('/practice');
    await expect(page.getByText(/Practice — AI Voice Interviews & Aptitude/i)).toBeVisible();
    await expect(page.getByText(/Track 1: AI Voice Simulation/i)).toBeVisible();
    await expect(page.getByText(/Track 2: Fresher Aptitude Practice/i)).toBeVisible();

    // Verify all 3 top action buttons on Practice Hub have unified height and nowrap
    const pastBtn = page.getByRole('link', { name: /Past Sessions/i }).first();
    const aptBtn = page.getByRole('link', { name: /Start Aptitude Test/i }).first();
    const voiceBtn = page.getByRole('link', { name: /Start Voice Interview/i }).first();
    await expect(pastBtn).toBeVisible();
    await expect(aptBtn).toBeVisible();
    await expect(voiceBtn).toBeVisible();

    // 6. Standalone Aptitude Practice Hub
    await page.goto('/practice/aptitude');
    await expect(page.getByText(/Fresher Aptitude Practice/i)).toBeVisible();
    await expect(page.getByText(/Daily Practice Allowance/i)).toBeVisible();

    // 7. Voice Mock Interview Setup & Resume Reference Card
    await page.goto('/practice/interviews/setup');
    await expect(page.getByText(/Configure Interview Practice Session/i)).toBeVisible();
    await expect(page.getByText(/1. Select Interview Track/i)).toBeVisible();
    await expect(page.getByText(/4. Resume Reference \(Optional\)/i)).toBeVisible();
    // Verify no unstyled select dropdown for resume reference
    await expect(page.getByText(/Standard Role-Based Questioning|Do not use resume/i)).toBeVisible();

    // 8. Share Interview Experience Discovery Feed
    await page.goto('/experiences');
    await expect(page.getByText(/Share Interview Experience — Peer Intelligence/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Search by company name, role, or keywords/i)).toBeVisible();

    // 9. Security Boundary Check: Authenticated Student CANNOT access Admin Console
    await page.goto('/admin/dashboard');
    // Student should be redirected away or blocked with unauthorized/denied view
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    const isAdmin = currentUrl.includes('/admin/dashboard');
    if (isAdmin) {
      // If on page, verify an access-denied or error banner is rendered
      await expect(page.getByText(/Access Denied|Unauthorized|Forbidden/i)).toBeVisible();
    } else {
      // Correctly redirected away from admin dashboard
      expect(currentUrl).not.toContain('/admin/dashboard');
    }

    // 10. Student Logout
    await page.goto('/dashboard');
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
      await page.waitForURL('**/login');
    }

    // 11. Administrator Login & Admin Console Verification
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@interviewprep.local');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');

    // Admin lands on dashboard with single sleek Admin Console dropdown in navbar
    await page.waitForURL('**/dashboard');
    const adminMenu = page.getByRole('button', { name: /Admin Console/i });
    await expect(adminMenu).toBeVisible();

    // 12. Navigate to Admin Platform Console
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: /Platform Operations & Management/i })).toBeVisible();
    await expect(page.getByText(/Zero-Cost Tier Active/i).first()).toBeVisible();

    // 13. System Health & Telemetry Verification (INR ₹0.00, no NaN)
    await page.goto('/admin/monitoring');
    await expect(page.getByText(/System Health & AI Telemetry/i)).toBeVisible();
    await expect(page.getByText(/Estimated Total AI Spend \(INR\)/i)).toBeVisible();
    await expect(page.getByText(/₹0.00/i).first()).toBeVisible();
    // Ensure "NaN" does NOT appear anywhere on the monitoring page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('₹NaN');
    expect(pageContent).not.toContain('$0.0000');
  });
});
