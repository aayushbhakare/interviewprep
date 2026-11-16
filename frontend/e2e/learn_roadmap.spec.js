import { test, expect } from '@playwright/test';

test.describe('Phase 3 — Learn Module & Personalized Roadmap', () => {
  test('Unauthenticated user on /learn sees guest roadmap intro and sign in prompt', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.locator('h1')).toContainText('Master the engineering standards of your target salary range.');
    await expect(page.getByRole('link', { name: 'Sign In to Continue' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register Free' })).toBeVisible();
  });

  test('Authenticated student completes roadmap setup wizard, topic progress, and replacement modal', async ({ page }) => {
    // 1. Log in with verified student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e_student@interviewprep.local');
    await page.fill('input[name="password"]', 'E2EPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Navigate to Learn module
    await page.locator('nav').getByRole('link', { name: 'Learn' }).click();
    await expect(page).toHaveURL(/\/learn$/);

    // Wait for initial roadmap check to complete
    await expect(page.getByText('Retrieving your learning roadmap...')).not.toBeVisible();

    // If active roadmap already exists from a previous test run, initiate replacement
    const replaceBtn = page.getByRole('button', { name: 'Replace Roadmap' });
    if (await replaceBtn.isVisible()) {
      await replaceBtn.click();
      await page.getByRole('button', { name: 'Proceed to Replacement' }).click();
    } else {
      await page.getByRole('button', { name: 'Start Roadmap Setup' }).click();
    }

    // Step 1: Target Role
    await expect(page.getByRole('heading', { name: 'Select your Target Role' })).toBeVisible();
    await page.getByRole('button', { name: 'Backend Developer' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 2: Experience Level
    await expect(page.getByRole('heading', { name: 'Select your Experience Level' })).toBeVisible();
    await page.getByRole('button', { name: 'Fresher' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 3: Target Salary
    await expect(page.getByRole('heading', { name: 'Target Salary Tier (Optional)' })).toBeVisible();
    await page.getByRole('button', { name: '₹5–7 LPA' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 4: Language & Framework
    await expect(page.getByRole('heading', { name: 'Select Programming Language' })).toBeVisible();
    await page.getByRole('button', { name: 'Python', exact: true }).click();
    await page.getByRole('button', { name: 'Django', exact: true }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 5: Database
    await expect(page.getByRole('heading', { name: 'Select Primary Database' })).toBeVisible();
    await page.getByRole('button', { name: 'PostgreSQL' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 6: Review Summary & Generate
    await expect(page.getByRole('heading', { name: 'Review & Generate Roadmap' })).toBeVisible();
    await expect(page.getByText('Backend Developer', { exact: true })).toBeVisible();
    await expect(page.getByText('Python / Django', { exact: true })).toBeVisible();
    await expect(page.getByText('PostgreSQL', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Generate Roadmap' }).click();

    // Verify Roadmap Viewer is rendered
    await expect(page.locator('h1')).toContainText('Backend Developer Learning Roadmap');
    await expect(page.getByText('Overall Roadmap Mastery')).toBeVisible();

    // 3. Test Topic Completion Checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(firstCheckbox).not.toBeChecked();
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();

    // 4. Test Skip Topic
    const skipBtn = page.getByRole('button', { name: 'Skip' }).first();
    await skipBtn.click();
    await expect(page.getByText('Not Verified').first()).toBeVisible();

    // 5. Test Study Content Modal
    const studyBtn = page.getByRole('button', { name: 'Study Content' }).first();
    await studyBtn.click();
    await expect(page.getByRole('heading', { name: 'Learning Objectives' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recruitment Interview Perspective' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // 6. Test Free Phase Navigation (Phase 2)
    const phase2Btn = page.getByRole('button', { name: /Phase 2/ });
    await phase2Btn.click();
    await expect(page.getByText(/Phase 2/i).first()).toBeVisible();

    // 7. Test Replace Roadmap Modal Cancel
    await page.getByRole('button', { name: 'Replace Roadmap' }).click();
    await expect(page.getByRole('heading', { name: 'Replace Active Roadmap' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel & Keep Roadmap' }).click();
    await expect(page.getByRole('heading', { name: 'Replace Active Roadmap' })).not.toBeVisible();
  });
});
