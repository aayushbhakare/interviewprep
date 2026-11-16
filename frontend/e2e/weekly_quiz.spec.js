import { test, expect } from '@playwright/test';

test.describe('Phase 4 — Shared Question Bank & Weekly Quiz System', () => {
  test('Complete Student Weekly Quiz Workflow: Instructions, Taking, Palette, Autosave, Submit, Results & Roadmap Milestone', async ({ page }) => {
    // 1. Log in with verified student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e_student@interviewprep.local');
    await page.fill('input[name="password"]', 'E2EPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Navigate to Learn module
    await page.locator('nav').getByRole('link', { name: 'Learn' }).click();
    await expect(page).toHaveURL(/\/learn$/);

    // If no roadmap exists, quickly create one
    const startSetupBtn = page.getByRole('button', { name: 'Start Roadmap Setup' });
    if (await startSetupBtn.isVisible()) {
      await startSetupBtn.click();
      await page.getByRole('button', { name: 'Backend Developer' }).click();
      await page.getByRole('button', { name: 'Next Step' }).click();
      await page.getByRole('button', { name: 'Fresher' }).click();
      await page.getByRole('button', { name: 'Next Step' }).click();
      await page.getByRole('button', { name: '₹5–7 LPA' }).click();
      await page.getByRole('button', { name: 'Next Step' }).click();
      await page.getByRole('button', { name: 'Python' }).click();
      await page.getByRole('button', { name: 'Django' }).click();
      await page.getByRole('button', { name: 'PostgreSQL' }).click();
      await page.getByRole('button', { name: 'Generate Personalized Roadmap' }).click();
      await expect(page.getByText('Roadmap Active')).toBeVisible({ timeout: 15000 });
    }

    // 3. Locate Week 1 Technical Assessment Card
    await expect(page.getByText('Week 1 Technical Assessment')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('45 Non-MCQ technical interview questions')).toBeVisible();

    // 4. Check whether to start or resume
    const resumeBtn = page.getByRole('button', { name: 'Resume Quiz' });
    const startBtn = page.getByRole('button', { name: /Start Quiz|Retake Quiz/ });

    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
    } else {
      await startBtn.click();

      // Verify Instructions Modal
      await expect(page.getByRole('heading', { level: 2, name: 'Week 1 Technical Assessment' })).toBeVisible();
      await expect(page.getByText('45', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Timer Enforced')).toBeVisible();
      await expect(page.getByText('Binary Grading:', { exact: false })).toBeVisible();

      // Click "Start Quiz Attempt"
      await page.getByRole('button', { name: 'Start Quiz Attempt' }).click();
    }

    // 5. Quiz Taking Screen
    await expect(page).toHaveURL(/\/learn\/quiz\/1\/take/);
    await expect(page.getByText('Week 1 Assessment')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Question Palette')).toBeVisible();

    // Verify 45 buttons in palette
    const paletteButtons = page.locator('aside button');
    await expect(paletteButtons).toHaveCount(45);

    // Question 1 answer interaction
    const answerInput = page.locator('textarea').first();
    await answerInput.fill('[10, 20] [10, 20]');

    const approachInput = page.locator('textarea').nth(1);
    await approachInput.fill('Default parameter mutable list binding.');

    // Wait for autosave trigger
    await page.waitForTimeout(1500);

    // Verify palette button 1 turns Answered (has emerald background)
    await expect(paletteButtons.first()).toHaveClass(/bg-emerald-600/);

    // Test Leave modal
    await page.getByRole('button', { name: 'Leave' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Abandon Quiz Attempt?' })).toBeVisible();
    await page.getByRole('button', { name: 'Stay in Quiz' }).click();

    // Test Submit modal
    await page.getByRole('button', { name: 'Submit Quiz' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Submit Weekly Assessment?' })).toBeVisible();
    await expect(page.getByText('Warning:', { exact: false })).toBeVisible();

    // Confirm final submission
    await page.getByRole('button', { name: 'Confirm Submission' }).click();

    // 6. Quiz Results Screen
    await expect(page).toHaveURL(/\/learn\/quiz\/.*\/results$/, { timeout: 20000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Assessment Results' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByText('Correct').first()).toBeVisible();
    await expect(page.getByText('Incorrect').first()).toBeVisible();

    // Expand Question 1 in Review
    await page.getByText('Question 1', { exact: false }).first().click();
    await expect(page.getByText('Your Submitted Answer')).toBeVisible();
    await expect(page.getByText('Expected Solution / Criteria')).toBeVisible();
    await expect(page.getByText('Technical Explanation:')).toBeVisible();

    // 7. Return to Learn Roadmap and verify milestone
    await page.getByRole('link', { name: 'Back to Learning Roadmap' }).click();
    await expect(page).toHaveURL(/\/learn$/);

    // Assessment card now displays Score and View Results
    await expect(page.getByRole('heading', { level: 3, name: 'Week 1 Technical Assessment' })).toBeVisible();
    await expect(page.getByText('Score:', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Results' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Past Attempts' })).toBeVisible();
  });
});
