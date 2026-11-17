import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Phase 6 — AI-Powered Interview Practice Module', () => {
  test.beforeEach(() => {
    // Reset test student interview sessions and cooling periods for test idempotency
    try {
      execSync(
        `cd ../backend && .venv/bin/python manage.py shell -c "from apps.accounts.models import User; from apps.interviews.models import InterviewSession, InterviewCoolingPeriod; u = User.objects.filter(email='e2e_student@interviewprep.local').first(); u and (InterviewSession.objects.filter(student=u).delete(), InterviewCoolingPeriod.objects.filter(user=u).delete())"`,
        { stdio: 'ignore' }
      );
    } catch {
      // Ignored if backend shell is unavailable in CI
    }
  });

  test('Complete Technical Voice Interview Workflow: Setup, Simulation, Live Turns, Interruption, Binary Verdict & History', async ({
    page,
  }) => {
    // 1. Log in with verified student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e_student@interviewprep.local');
    await page.fill('input[name="password"]', 'E2EPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Navigate to Practice module
    await page.locator('nav').getByRole('link', { name: 'Practice' }).click();
    await expect(page).toHaveURL(/\/practice$/);

    // 3. Locate Track 1 AI Voice Simulation card (must be Active)
    await expect(page.getByText('Track 1: AI Voice Simulation')).toBeVisible();
    await expect(page.locator('text=Real-Time Voice • Binary PASS/FAIL')).toBeVisible();

    // 4. Enter Interview Setup
    await page.getByRole('link', { name: /Start Voice Interview/i }).first().click();
    await expect(page).toHaveURL(/\/practice\/interviews\/setup/);

    // 5. Verify Setup Page elements
    await expect(page.getByRole('heading', { level: 1, name: /Configure Interview Practice Session/i })).toBeVisible();
    await expect(page.getByText('1. Select Interview Track')).toBeVisible();
    await expect(page.getByText('2. Target Role & Compensation Standard')).toBeVisible();

    // Click "Technical Interview" track
    await page.getByRole('button', { name: /Technical Interview/i }).click();

    // 6. Start Voice Interview Simulation
    const startSimBtn = page.getByRole('button', { name: /Start Voice Interview Simulation/i });
    await expect(startSimBtn).toBeVisible();
    await startSimBtn.click();

    // 7. Verify Active Simulation Room View
    await expect(page).toHaveURL(/\/practice\/interviews\/.*\/active$/, { timeout: 15000 });
    await expect(page.getByText('AI Technical Evaluator')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Live Conversation Feed')).toBeVisible();
    await expect(page.getByRole('button', { name: /Interrupt Interviewer/i })).toBeVisible();

    // 8. Submit candidate spoken response via fallback/testing input
    const inputField = page.locator('input[placeholder*="type an answer"]');
    await expect(inputField).toBeVisible();
    await inputField.fill('In Python and Django, we optimize queries using select_related and index lookup tables.');
    await page.locator('form button[type="submit"]').click();

    // Verify turn was registered in conversation feed
    await expect(page.getByText('In Python and Django, we optimize queries')).toBeVisible({ timeout: 8000 });

    // Submit a clarifying answer
    await inputField.fill('We handle database transactions using atomic blocks to guarantee ACID compliance.');
    await page.locator('form button[type="submit"]').click();

    // Submit third substantive answer to complete technical quota
    await inputField.fill('To mitigate race conditions under scale we use optimistic locking with version columns.');
    await page.locator('form button[type="submit"]').click();

    // 9. Verify results compilation and scorecard
    // When completed, it redirects to /results
    await page.goto(`/practice/interviews/${page.url().split('/')[5]}/results`);
    await expect(page.getByText(/INTERVIEW PASSED|INTERVIEW NOT CLEARED/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Constructive Performance Evaluation & Feedback')).toBeVisible();
    await expect(page.getByText('Binary Recruitment Decision')).toBeVisible();

    // 10. Verify Past Interviews History
    await page.getByRole('link', { name: /View Past Interviews/i }).click();
    await expect(page).toHaveURL(/\/practice\/interviews\/history/);
    await expect(page.getByRole('heading', { level: 1, name: /Interview Practice History/i })).toBeVisible();
    await expect(page.getByText(/Technical Interview/i).first()).toBeVisible();
  });

  test('Admin Interview Simulation Configuration: Cooling Hours, Cutoff & Telemetry', async ({
    page,
  }) => {
    // 1. Log in as staff administrator via standard auth
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@interviewprep.local');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Navigate to Interview Simulation Admin
    await page.goto('/admin/interviews');
    await expect(page.getByRole('heading', { level: 1, name: /Interview Simulation Administration/i })).toBeVisible();
    await expect(page.getByText('Total Sessions')).toBeVisible();
    await expect(page.getByText('Overall Pass Rate')).toBeVisible();

    // 3. Update Technical Cooling Hours to 18
    const techInput = page.locator('input[type="number"]').first();
    await techInput.fill('18');
    await page.getByRole('button', { name: /Save Configuration/i }).click();

    // Verify success toast
    await expect(page.getByText(/Interview simulation parameters successfully saved/i)).toBeVisible();
  });
});
