import { chromium } from 'playwright';
import path from 'path';

const EVIDENCE_DIR = '/Users/aayushbhakare/.gemini/antigravity/brain/000a2344-d99e-4474-8580-ecba25d0607b/phase7_evidence';

async function capture() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log('Logging in student...');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="email"]', 'e2e_student@interviewprep.local');
  await page.fill('input[name="password"]', 'E2EPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // 1. Experiences Discovery Feed
  console.log('Capturing 01_experiences_discovery_feed.png...');
  await page.goto('http://localhost:5173/experiences');
  await page.waitForSelector('text=Razorpay');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_experiences_discovery_feed.png'), fullPage: false });

  // 2. Experience Editor - Basic Information
  console.log('Capturing 02_experience_editor_basic_info.png...');
  await page.goto('http://localhost:5173/experiences/new');
  await page.waitForSelector('text=1. Basic Recruitment Details');
  await page.fill('input[placeholder*="Google, Flipkart"]', 'CloudScale Systems');
  await page.fill('input[placeholder*="Backend Developer, SDE"]', 'Distributed Systems Engineer');
  await page.selectOption('select:has-text("₹3 - ₹6 LPA")', '₹18 - ₹30 LPA');
  await page.selectOption('select:has-text("Fresher")', '1-3 Years');
  await page.fill('input[placeholder*="Bengaluru, Pune"]', 'Bengaluru, India');
  await page.fill('textarea[placeholder*="Describe how you applied"]', 'Applied via employee referral. Fast-tracked technical evaluation process.');
  await page.check('#isAnonymous');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_experience_editor_basic_info.png'), fullPage: false });

  // 3. Experience Editor - Stages Builder
  console.log('Capturing 03_experience_editor_journey_stages.png...');
  await page.evaluate(() => window.scrollTo(0, 520));
  await page.waitForTimeout(300);
  await page.fill('input[placeholder*="Coding Assessment, System Architecture"]', 'Machine Coding & Concurrency');
  await page.fill('textarea[placeholder*="What was the format?"]', '90-minute live coding session implementing an asynchronous rate limiter.');
  await page.fill('textarea[placeholder*="Exact question asked by interviewer"]', 'Implement leaky bucket rate limiter in Python with atomic sliding window.');
  await page.fill('textarea[placeholder*="Follow-up question or twist"]', 'How do you coordinate limits across 50 containerized instances without a centralized lock bottleneck?');
  await page.fill('textarea[placeholder*="What was the interviewer looking for?"]', 'Concurrency safety, Redis atomicity, handling burst traffic without thundering herd.');
  await page.fill('textarea[placeholder*="Your response, algorithm, or thought process"]', 'Designed a sliding window counter using Redis Lua script for atomic score evaluation.');
  // Defocus active element so no input has an ugly focus outline in screenshot
  await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_experience_editor_journey_stages.png'), fullPage: false });

  // 4. Experience Detail Journey Breakdown
  console.log('Capturing 04_experience_detail_journey.png...');
  await page.goto('http://localhost:5173/experiences');
  await page.waitForSelector('text=Razorpay');
  await page.click('text=Razorpay');
  await page.waitForSelector('text=Backend Platform Engineer');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_experience_detail_journey.png'), fullPage: false });

  // 5. Helpful Vote Toggle Active
  console.log('Capturing 05_experience_helpful_vote_active.png...');
  const helpfulBtn = page.getByRole('button', { name: /Helpful/i });
  await helpfulBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_experience_helpful_vote_active.png'), fullPage: false });

  // 6. Community Report Modal
  console.log('Capturing 06_experience_report_modal.png...');
  await page.getByRole('button', { name: /Report/i }).click();
  await page.waitForSelector('text=Report Interview Experience');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_experience_report_modal.png'), fullPage: false });
  // Close modal
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(300);

  // 7. My Experiences Submissions Dashboard
  console.log('Capturing 07_my_experiences_dashboard.png...');
  await page.goto('http://localhost:5173/my-experiences');
  await page.waitForSelector('text=My Interview Stories & Submissions');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_my_experiences_dashboard.png'), fullPage: false });

  // 8. Admin Moderation Console
  console.log('Capturing 08_admin_experience_moderation.png...');
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto('http://localhost:5173/login');
  await adminPage.fill('input[name="email"]', 'admin@interviewprep.local');
  await adminPage.fill('input[name="password"]', 'AdminPass123!');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/dashboard');

  await adminPage.goto('http://localhost:5173/admin/experiences');
  await adminPage.waitForSelector('text=Interview Experience Moderation Console');
  await adminPage.getByRole('button', { name: /PUBLISHED/i }).click();
  await adminPage.waitForTimeout(600);
  const reviewBtn = adminPage.getByRole('button', { name: /Review/i }).first();
  if (await reviewBtn.isVisible()) {
    await reviewBtn.click();
    await adminPage.waitForSelector('text=Experience Moderation Review');
    await adminPage.waitForTimeout(600);
  }
  await adminPage.screenshot({ path: path.join(EVIDENCE_DIR, '08_admin_experience_moderation.png'), fullPage: false });
  await adminContext.close();

  console.log('All 8 Phase 7 evidence screenshots captured successfully.');
  await browser.close();
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
