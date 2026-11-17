import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const EVIDENCE_DIR = path.resolve(
  '/Users/aayushbhakare/.gemini/antigravity/brain/000a2344-d99e-4474-8580-ecba25d0607b/phase8_evidence'
);

test.describe('Phase 8 — Admin Panel & Platform Management System', () => {
  test.beforeAll(() => {
    // Ensure admin user and a test student exist in the database
    try {
      execSync(
        `cd ../backend && .venv/bin/python manage.py shell -c "from apps.accounts.models import User, StudentProfile; a, _ = User.objects.get_or_create(email='admin@interviewprep.local', defaults={'full_name': 'System Administrator', 'is_staff': True, 'is_superuser': True, 'is_verified': True, 'is_active': True}); a.set_password('AdminPass123!'); a.is_staff = True; a.is_active = True; a.save(); s, _ = User.objects.get_or_create(email='e2e_student@interviewprep.local', defaults={'full_name': 'E2E Candidate', 'is_verified': True, 'is_active': True}); s.set_password('E2EPassword123!'); s.is_suspended = False; s.save(); StudentProfile.objects.get_or_create(user=s, defaults={'target_role': 'Backend Developer', 'target_salary_range': '₹10-18 LPA', 'experience_level': 'Fresher'})"`,
        { stdio: 'ignore' }
      );
    } catch {
      // Ignored
    }
  });

  test('Complete Admin Workflow: Dashboard, Student Governance, Content Versioning, Settings, AI Models, Monitoring, Activity Logs, and Maintenance', async ({
    page,
  }) => {
    test.setTimeout(90000);
    // Set 1280x800 desktop resolution for standard evidence capture
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Log in as platform administrator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@interviewprep.local');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Open Admin Console and navigate to Admin Dashboard
    const adminMenuBtn = page.locator('nav').getByRole('button', { name: /Admin Console/i });
    await expect(adminMenuBtn).toBeVisible();
    await adminMenuBtn.click();
    await page.getByRole('link', { name: /Admin Dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    // Verify Platform Operations Dashboard
    await expect(page.getByRole('heading', { level: 1, name: /Platform Operations & Management/i })).toBeVisible();
    await expect(page.getByText(/Zero-Cost Tier Active/i)).toBeVisible();
    await expect(page.getByText(/Platform Student Activity Overview/i)).toBeVisible();

    // Screenshot 1: Admin Dashboard Overview
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '01_admin_dashboard_overview.png'),
      fullPage: false,
    });

    // 3. Navigate to Student Management
    await page.getByRole('link', { name: /Student Management/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/students$/);
    await expect(page.getByRole('heading', { level: 1, name: /Student Account Governance/i })).toBeVisible();

    // Search for test student
    const searchInput = page.getByPlaceholder(/Search student by full name/i);
    await searchInput.fill('e2e_student');
    await page.waitForTimeout(500);

    // Open Student Dossier
    const detailsBtn = page.getByRole('button', { name: /Details/i }).first();
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();
      await expect(page.getByText(/Aggregated Module Activity Dossier/i)).toBeVisible();
      await page.getByRole('button', { name: /Close Dossier/i }).click();
    }

    // Suspend test student
    const suspendBtn = page.getByRole('button', { name: /Suspend/i }).first();
    if (await suspendBtn.isVisible()) {
      await suspendBtn.click();
      await expect(page.getByRole('heading', { level: 3, name: /Enforce Account Suspension/i })).toBeVisible();
      await page.fill('textarea[placeholder*="policy or security justification"]', 'Automated E2E security audit compliance suspension.');
      await page.getByRole('button', { name: /Confirm Suspension/i }).click();
      await page.waitForTimeout(600);
    }

    // Screenshot 2: Student Management Console
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '02_student_management_console.png'),
      fullPage: false,
    });

    // Reactivate student to keep database healthy
    const reactivateBtn = page.getByRole('button', { name: /Reactivate/i }).first();
    if (await reactivateBtn.isVisible()) {
      page.on('dialog', (dialog) => dialog.accept());
      await reactivateBtn.click();
      await page.waitForTimeout(600);
    }

    // 4. Navigate to Learning Content
    await page.getByRole('link', { name: /Learning Content/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/learning$/);
    await expect(page.getByRole('heading', { level: 1, name: /Learning Roadmap Content Management/i })).toBeVisible();

    // Open Version / Edit modal for the first topic
    const versionBtn = page.getByRole('button', { name: /Version \/ Edit/i }).first();
    if (await versionBtn.isVisible()) {
      await versionBtn.click();
      await expect(page.getByText(/Safe Progress Preservation/i)).toBeVisible();
      await expect(page.getByText(/Content Versioning/i)).toBeVisible();
    }

    // Screenshot 3: Learning Content Versioning
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '03_learning_content_versioning.png'),
      fullPage: false,
    });

    // Close versioning modal
    const cancelModalBtn = page.getByRole('button', { name: /Cancel/i }).first();
    if (await cancelModalBtn.isVisible()) {
      await cancelModalBtn.click();
    }

    // 5. Navigate to Platform Settings
    await page.getByRole('link', { name: /Platform Settings/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/settings$/);
    await expect(page.getByRole('heading', { level: 1, name: /Platform Settings & System Parameters/i })).toBeVisible();

    // Verify Aptitude tab and inputs
    await expect(page.getByText(/Aptitude Module Parameters/i)).toBeVisible();
    await expect(page.getByText(/Total Questions per Session/i)).toBeVisible();

    // Screenshot 4: Platform Settings Console
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '04_platform_settings_console.png'),
      fullPage: false,
    });

    // 6. Navigate to AI Models & Routing
    await page.getByRole('link', { name: /AI Models & Routing/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/ai-models$/);
    await expect(page.getByRole('heading', { level: 1, name: /AI Model & Provider Routing/i })).toBeVisible();
    await expect(page.getByText(/Deterministic Zero-Cost Fallback Architecture/i)).toBeVisible();

    // Screenshot 5: AI Models and Routing Matrix
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '05_ai_models_and_routing.png'),
      fullPage: false,
    });

    // 7. Navigate to System Monitoring
    await page.getByRole('link', { name: /System Monitoring/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/monitoring$/);
    await expect(page.getByRole('heading', { level: 1, name: /System Health & AI Telemetry/i })).toBeVisible();
    await expect(page.getByText(/PostgreSQL Query Latency/i)).toBeVisible();
    await expect(page.getByText(/Estimated Total AI Spend \(INR\)/i)).toBeVisible();

    // Screenshot 6: System Health and Telemetry
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '06_system_health_and_telemetry.png'),
      fullPage: false,
    });

    // 8. Navigate to Activity Audit Logs
    await page.getByRole('link', { name: /Activity Audit Logs/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/activity-logs$/);
    await expect(page.getByRole('heading', { level: 1, name: /Immutable Administrative Audit Logs/i })).toBeVisible();

    // Open first Inspect modal
    const inspectBtn = page.getByRole('button', { name: /Inspect/i }).first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await expect(page.getByText(/Audit Event Dossier/i)).toBeVisible();
      await page.waitForTimeout(300);
    }

    // Screenshot 7: Immutable Activity Logs
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '07_immutable_activity_logs.png'),
      fullPage: false,
    });

    const closeInspectBtn = page.getByRole('button', { name: /Close Inspector/i }).first();
    if (await closeInspectBtn.isVisible()) {
      await closeInspectBtn.click();
    }

    // 9. Navigate to Maintenance Controls
    await page.getByRole('link', { name: /Maintenance Controls/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/maintenance$/);
    await expect(page.getByRole('heading', { level: 1, name: /Platform Maintenance & Service Availability/i })).toBeVisible();
    await expect(page.getByText(/Staff Administrator Exemption/i)).toBeVisible();

    // Screenshot 8: Maintenance Controls
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '08_maintenance_controls.png'),
      fullPage: false,
    });
  });
});
