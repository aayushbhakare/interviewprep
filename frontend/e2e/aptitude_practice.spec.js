import { test, expect } from '@playwright/test';

test.describe('Phase 5 — Aptitude Practice Module', () => {
  test('Complete Fresher Aptitude Practice Workflow: Hub, Test Taking, Palette, Autosave, Submit, Review & Scorecard', async ({
    page,
  }) => {
    // 1. Log in with verified fresher student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e_student@interviewprep.local');
    await page.fill('input[name="password"]', 'E2EPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Navigate to Practice module
    await page.locator('nav').getByRole('link', { name: 'Practice' }).click();
    await expect(page).toHaveURL(/\/practice$/);

    // 3. Locate Track 2 Aptitude Card and Banner
    await expect(page.getByText('Track 2: Fresher Aptitude Practice')).toBeVisible();
    await expect(page.getByText('Aptitude Practice Module is Active')).toBeVisible();

    // 4. Enter Aptitude Hub
    await page.getByRole('link', { name: /Enter Aptitude Hub|Start Aptitude Test/ }).first().click();
    await expect(page).toHaveURL(/\/practice\/aptitude$/);

    // 5. Verify Hub Features
    await expect(page.getByRole('heading', { level: 1, name: /Aptitude Practice/i })).toBeVisible();
    await expect(page.getByText('45 MCQs')).toBeVisible();
    await expect(page.getByText('60 Minutes')).toBeVisible();
    await expect(page.getByText('Daily Practice Allowance')).toBeVisible();

    // 6. Start or Resume Test
    const startTestBtn = page.getByRole('button', { name: /Start Aptitude Practice Test|Resume Practice Test/ });
    await expect(startTestBtn).toBeVisible();
    await startTestBtn.click();

    // 7. Verify Test Taking View
    await expect(page).toHaveURL(/\/practice\/aptitude\/.*\/take$/, { timeout: 15000 });
    await expect(page.getByText('Aptitude Practice Test')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Question Palette')).toBeVisible();

    // Palette grid must have exactly 45 question buttons
    const paletteButtons = page.locator('aside .grid button');
    await expect(paletteButtons).toHaveCount(45);

    // Question 1: Select Option A
    const optionA = page.locator('main .space-y-3 button').first();
    await optionA.click();

    // Wait for debounced autosave (1.6s)
    await page.waitForTimeout(1600);

    // Check Question 2 via palette
    await paletteButtons.nth(1).click();
    await expect(page.getByText('Q2 of 45')).toBeVisible();

    // Question 2: Select Option B
    const optionB = page.locator('main .space-y-3 button').nth(1);
    await optionB.click();
    await page.waitForTimeout(1600);

    // 8. Test Leave Modal
    await page.getByRole('button', { name: 'Leave' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Leave Aptitude Test?' })).toBeVisible();
    await page.getByRole('button', { name: 'Resume Test' }).click();

    // 9. Submit Test
    await page.locator('aside button:has-text("Submit Test")').click();
    await expect(page.getByRole('heading', { level: 3, name: 'Submit Aptitude Test?' })).toBeVisible();
    await expect(page.getByText(/You have \d+ unanswered questions/i)).toBeVisible();

    // Confirm submission
    await page.getByRole('button', { name: 'Confirm Submission' }).click();

    // 10. Results & Scorecard Page
    await expect(page).toHaveURL(/\/practice\/aptitude\/.*\/results$/, { timeout: 20000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Aptitude Practice Scorecard' })).toBeVisible({
      timeout: 15000,
    });

    // Check practice notice (No Pass/Fail)
    await expect(page.getByText('Practice Module Performance:')).toBeVisible();
    await expect(page.getByText('do not issue recruitment pass/fail verdicts', { exact: false })).toBeVisible();

    // Check scorecard metrics
    await expect(page.getByText('Overall Score')).toBeVisible();
    await expect(page.getByText('Correct Answers', { exact: true })).toBeVisible();
    await expect(page.getByText('Incorrect / Skipped')).toBeVisible();
    await expect(page.getByText('Time Taken')).toBeVisible();

    // Check Section Breakdown
    await expect(page.getByText('Section-wise Performance Breakdown')).toBeVisible();
    await expect(page.getByText('Quantitative Aptitude').first()).toBeVisible();
    await expect(page.getByText('Logical Reasoning').first()).toBeVisible();
    await expect(page.getByText('Verbal Ability').first()).toBeVisible();

    // Check Question Review and Explanation
    await expect(page.getByText('Step-by-Step Explanation & Working:').first()).toBeVisible();

    // Filter interaction
    await page.getByRole('button', { name: /Correct \(/ }).click();
    await page.getByRole('button', { name: /Skipped \(/ }).click();
    await page.getByRole('button', { name: /All \(/ }).click();

    // Return to Aptitude Hub
    await page.getByRole('link', { name: 'Back to Aptitude Practice' }).first().click();
    await expect(page).toHaveURL(/\/practice\/aptitude$/);
  });

  test('Admin Aptitude Management: Questions Catalog, Filters, Platform Rules & Config', async ({ page }) => {
    // 1. Log in as staff administrator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@interviewprep.local');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Navigate to Aptitude Admin via Navbar
    await page.locator('nav').getByRole('link', { name: 'Aptitude Admin' }).click();
    await expect(page).toHaveURL(/\/admin\/aptitude$/);

    // 3. Verify Admin Page Header and Stats
    await expect(page.getByRole('heading', { level: 1, name: 'Aptitude Bank & Platform Management' })).toBeVisible();
    await expect(page.getByText('Total Questions')).toBeVisible();
    await expect(page.getByText('Approved Active')).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^Suspended$/ })).toBeVisible();

    // 4. Verify Catalog Table
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Aptitude MCQ' })).toBeVisible();

    // 5. Test Tab Switching to Platform Rules & Config
    await page.getByRole('button', { name: 'Platform Rules & Config' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Aptitude Engine Configuration' })).toBeVisible();
    await expect(page.getByText('Daily Standalone Practice Limit')).toBeVisible();
    await expect(page.getByText('Test Duration (Minutes)')).toBeVisible();
    await expect(page.getByText('Total Test Questions')).toBeVisible();
    await expect(page.getByText('Phase 6 Qualifying Cutoff (%)')).toBeVisible();

    // 6. Test Student Reports Tab
    await page.getByRole('button', { name: 'Student Reports' }).click();
    await expect(page.getByText('No student reports logged. All questions are in good standing!')).toBeVisible();
  });
});
