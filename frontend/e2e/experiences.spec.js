import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Phase 7 — Share Interview Experience Module', () => {
  test.beforeEach(() => {
    // Reset test student interview experiences for idempotency
    try {
      execSync(
        `cd ../backend && .venv/bin/python manage.py shell -c "from apps.accounts.models import User; from apps.experiences.models import InterviewExperience; u = User.objects.filter(email='e2e_student@interviewprep.local').first(); u and InterviewExperience.objects.filter(author=u).delete()"`,
        { stdio: 'ignore' }
      );
    } catch {
      // Ignored if backend shell is unavailable
    }
  });

  test('Complete Student & Admin Workflow: Discovery, Drafting, Flexible Journey Stages, Anonymous Publishing, Helpful Vote, Reporting & Admin Moderation', async ({
    page,
  }) => {
    // 1. Log in with verified student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e_student@interviewprep.local');
    await page.fill('input[name="password"]', 'E2EPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Navigate to Share Experience module via Navbar
    await page.locator('nav').getByRole('link', { name: /Share Experience/i }).click();
    await expect(page).toHaveURL(/\/experiences$/);

    // 3. Verify Module Header & Backward-Compatible E2E Anchor Headings
    await expect(
      page.getByRole('heading', { level: 1, name: /Share Interview Experience/i })
    ).toBeVisible();
    await expect(page.getByText('Module Status: Scheduled for Phase 8')).toBeVisible();
    await expect(page.getByText('Risk-Based Auto Moderation')).toBeVisible();
    await expect(page.getByText('Discovery Taxonomy (Preview)')).toBeVisible();

    // 4. Click "Share Your Experience" button to open Editor
    await page.getByRole('link', { name: /Share Your Experience/i }).click();
    await expect(page).toHaveURL(/\/experiences\/new/);

    // 5. Fill Basic Information Form
    await page.fill('input[placeholder*="Google, Flipkart"]', 'CloudScale Systems');
    await page.fill('input[placeholder*="Backend Developer, SDE"]', 'Backend Platform Engineer');
    await page.selectOption('select:has-text("₹3 - ₹6 LPA")', '₹10 - ₹18 LPA');
    await page.selectOption('select:has-text("Fresher")', '1-3 Years');
    await page.fill('input[placeholder*="Bengaluru, Pune"]', 'Bengaluru, India');
    await page.selectOption('select:has-text("Selected / Offered")', 'selected');
    await page.fill(
      'textarea[placeholder*="Describe how you applied"]',
      'Applied via direct employee referral in Q1 2025. Preparation involved system design and database indexing.'
    );

    // Check Anonymous Publishing toggle
    await page.check('#isAnonymous');

    // 6. Complete Stage 1 details
    await page.fill('input[placeholder*="Coding Assessment, System Architecture"]', 'Technical Architecture Round');
    await page.fill(
      'textarea[placeholder*="What was the format?"]',
      '60-minute Google Meet deep dive on distributed caching and concurrency.'
    );

    // Fill Stage 1 Question
    await page.fill(
      'input[placeholder="Exact question asked by interviewer..."]',
      'Explain cache stampede prevention strategies and Redis mutex locks.'
    );
    await page.fill(
      'input[placeholder="Follow-up question or twist (optional)..."]',
      'How does probabilistic early expiration (XFetch) compare to distributed locks?'
    );
    await page.fill(
      'textarea[placeholder*="What was the interviewer looking for?"]',
      'Deep understanding of thundering herd mitigation under 10k RPS load.'
    );
    await page.fill(
      'textarea[placeholder*="Your response, algorithm, or thought process..."]',
      'Discussed mutex lock with TTL, background cron refresh, and optimal cache stampede beta algorithm.'
    );

    // 7. Test Save Draft
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByText(/Draft saved successfully/i)).toBeVisible();

    // 8. Publish the Experience
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole('button', { name: /Publish Experience/i }).click();

    // 9. Should redirect to Experience Detail Page
    await expect(page).toHaveURL(/\/experiences\/[a-f0-9-]+$/);

    // 10. Verify Detail Page Structure & Content
    await expect(page.getByText('CloudScale Systems')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /Backend Platform Engineer/i })).toBeVisible();
    await expect(page.getByText('Selected / Offered')).toBeVisible();
    await expect(page.getByText('₹10 - ₹18 LPA')).toBeVisible();
    // Anonymous Masking Check: author should be "Anonymous Candidate"
    await expect(page.getByText('Anonymous Candidate')).toBeVisible();

    // Verify Stage & Question Content
    await expect(page.getByText('Technical Architecture Round')).toBeVisible();
    await expect(page.getByText('Explain cache stampede prevention strategies and Redis mutex locks.')).toBeVisible();
    await expect(page.getByText('Follow-up: How does probabilistic early expiration (XFetch) compare to distributed locks?')).toBeVisible();

    // 11. Test Helpful Vote Toggle
    const helpfulBtn = page.getByRole('button', { name: /Helpful \(0\)/i });
    await expect(helpfulBtn).toBeVisible();
    await helpfulBtn.click();
    // Counter updates to 1
    await expect(page.getByRole('button', { name: /Helpful \(1\)/i })).toBeVisible();

    // 12. Test Reporting Flow
    await page.getByRole('button', { name: /Report/i }).click();
    await expect(page.getByText('Report Interview Experience')).toBeVisible();
    await page.check('input[value="fake"]');
    await page.fill('textarea[placeholder*="Provide specific context"]', 'Automated E2E test report verification.');
    await page.getByRole('button', { name: /Submit Report/i }).click();
    await expect(page.getByText('Report Submitted')).toBeVisible();

    // 13. Verify in My Experiences
    await page.goto('/my-experiences');
    await expect(page.getByText('CloudScale Systems')).toBeVisible();
    await expect(page.getByText('1 Helpful')).toBeVisible();

    // 14. Admin Moderation Verification
    // Log out and log in as staff administrator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@interviewprep.local');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Open Admin Console dropdown and navigate to Experience Moderation
    const adminConsoleBtn = page.locator('nav').getByRole('button', { name: /Admin Console/i });
    if (await adminConsoleBtn.isVisible()) {
      await adminConsoleBtn.click();
    }
    await page.locator('nav').getByRole('link', { name: /Experience Moderation/i }).click();
    await expect(page).toHaveURL(/\/admin\/experiences$/);
    await expect(page.getByText('Interview Experience Moderation Console')).toBeVisible();

    // Check published tab in admin queue
    await page.getByRole('button', { name: /PUBLISHED/i }).click();
    await expect(page.getByText('CloudScale Systems')).toBeVisible();
    // Admin sees candidate actual email and Anonymous flag
    await expect(page.getByText('e2e_student@interviewprep.local')).toBeVisible();
    await expect(page.getByText('Anonymous Publicly')).toBeVisible();

    // Check Community Reports tab
    await page.getByRole('button', { name: /Community Reports/i }).click();
    await expect(page.getByText('CloudScale Systems - Backend Platform Engineer')).toBeVisible();
  });
});
