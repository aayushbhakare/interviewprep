import { test, expect } from '@playwright/test';

test.describe('Public Landing Page & Platform Branding', () => {
  test('Landing page renders all core sections on desktop', async ({ page }) => {
    await page.goto('/');

    // Page title and favicon
    await expect(page).toHaveTitle(/InterviewPrep — Salary-Wise Interview Preparation/);

    // Section 1: Navigation
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('InterviewPrep')).toBeVisible();
    await expect(header.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'How It Works' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Salary-Wise Standard' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'AI Voice Simulation' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Get Started' })).toBeVisible();

    // Section 2: Hero
    await expect(
      page.getByRole('heading', { level: 1, name: /Your Target Salary.*Your Career Roadmap.*Your Interview Preparation/i })
    ).toBeVisible();
    await expect(page.getByText('Prepare for your next opportunity with personalized learning roadmaps')).toBeVisible();

    // Section 3: Product Preview
    await expect(page.getByText('Illustrative Candidate Journey')).toBeVisible();
    await expect(page.getByText('Backend Developer (APIs & Systems)')).toBeVisible();
    await expect(page.getByText('Fresher (< 1 Year)')).toBeVisible();
    await expect(page.getByText('₹7–9 LPA Tier')).toBeVisible();
    await expect(page.getByText('Python', { exact: true })).toBeVisible();
    await expect(page.getByText('Django', { exact: true })).toBeVisible();
    await expect(page.getByText('PostgreSQL', { exact: true })).toBeVisible();
    await expect(page.getByText('Voice Interview Simulation')).toBeVisible();
    await expect(page.getByText('INTERVIEW PASSED')).toBeVisible();

    // Section 4: Features
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();
    await expect(page.getByRole('heading', { name: '1. Personalized Learning Roadmaps' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '2. Hands-on Practice Roadmap' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '3. Aptitude Preparation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '4. AI Interview Simulations' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '5. Real Interview Experiences (Peer Intelligence)' })).toBeVisible();

    // Section 5: How It Works
    const howItWorksSection = page.locator('#how-it-works');
    await expect(howItWorksSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose Your Career Goal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Get Your Roadmaps' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Learn and Practice' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Simulate Recruitment' })).toBeVisible();

    // Section 6: Salary-wise and Role-wise Preparation
    const salaryWiseSection = page.locator('#salary-wise');
    await expect(salaryWiseSection).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Prepare for the Salary You Want, Not Just a Company You Choose.' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Salary-Wise & Role-Wise Mastery' })).toBeVisible();

    // Section 7: Simulation Modes
    const simulationSection = page.locator('#simulation-modes');
    await expect(simulationSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Technical Interview', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'HR & Behavioral Interview', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mixed Recruitment Process', exact: true })).toBeVisible();

    // Section 8: Final CTA
    await expect(
      page.getByRole('heading', { name: 'Your Next Opportunity Starts With Preparation.' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Preparing' })).toBeVisible();

    // Section 9: Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: 'InterviewPrep', exact: true })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'About InterviewPrep' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Contact & Support' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Platform Security' })).toBeVisible();
  });

  test('Navigation CTAs route to login and registration properly', async ({ page }) => {
    await page.goto('/');

    // Click Login
    await page.locator('header').getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();

    // Return to home and click Get Started
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: 'Create your student account' })).toBeVisible();
  });

  test('Footer informational links load corresponding pages without 404s', async ({ page }) => {
    await page.goto('/');

    // Check About page
    await page.locator('footer').getByRole('link', { name: 'About InterviewPrep' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1, name: 'About InterviewPrep' })).toBeVisible();
    await expect(page.getByText('Core Philosophy & Positioning')).toBeVisible();

    // Check Terms page
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Terms of Service' }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible();

    // Check Privacy page
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();

    // Check Contact page
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Contact & Support' }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Contact & Platform Support' })).toBeVisible();

    // Check Security page
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Platform Security' }).click();
    await expect(page).toHaveURL(/\/security$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Platform Security & Architecture' })).toBeVisible();
  });

  test('Mobile view renders hamburger menu and drawer navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Desktop nav should be hidden, hamburger visible
    const hamburgerBtn = page.getByRole('button', { name: 'Toggle navigation menu' });
    await expect(hamburgerBtn).toBeVisible();

    // Open mobile menu
    await hamburgerBtn.click();
    const mobileDrawer = page.locator('#mobile-drawer');
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(mobileDrawer.getByRole('link', { name: 'How It Works' })).toBeVisible();
    await expect(mobileDrawer.getByRole('link', { name: 'Get Started' })).toBeVisible();

    // Click Get Started in mobile drawer
    await mobileDrawer.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('Top-left brand logo on navigation bar redirects to the landing page from any route', async ({ page }) => {
    // 1. From Dashboard
    await page.goto('/dashboard');
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
    await expect(page.locator('h1')).toContainText('Your Target Salary');

    // 2. From Learn
    await page.goto('/learn');
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
    await expect(page.locator('h1')).toContainText('Your Target Salary');

    // 3. From Login page
    await page.goto('/login');
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
    await expect(page.locator('h1')).toContainText('Your Target Salary');
  });

  test('Navigating to another page from the bottom resets scroll position to the top', async ({ page }) => {
    await page.goto('/');

    // Scroll down to the bottom of the landing page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const initialScrollY = await page.evaluate(() => window.scrollY);
    expect(initialScrollY).toBeGreaterThan(500);

    // Click "About InterviewPrep" footer link
    await page.locator('footer').getByRole('link', { name: 'About InterviewPrep' }).click();
    await expect(page).toHaveURL(/\/about$/);

    // Verify window scroll position is reset to top
    await page.waitForFunction(() => window.scrollY === 0);
    const aboutScrollY = await page.evaluate(() => window.scrollY);
    expect(aboutScrollY).toBe(0);

    // Verify top heading and Back to Home are visible in viewport without scrolling
    const topHeading = page.getByRole('heading', { level: 1, name: 'About InterviewPrep' });
    await expect(topHeading).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeInViewport();

    // Click "Back to Home"
    await page.getByRole('link', { name: 'Back to Home' }).click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
    await page.waitForFunction(() => window.scrollY === 0);
    const homeScrollY = await page.evaluate(() => window.scrollY);
    expect(homeScrollY).toBe(0);
    await expect(page.locator('h1')).toBeInViewport();
  });

  test('Zero unwanted horizontal scroll across mobile, tablet, and desktop viewports', async ({ page }) => {
    const testViewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 800 },
    ];

    for (const vp of testViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const overflowDiff = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });

      expect(overflowDiff, `Expected no horizontal scroll on ${vp.name}`).toBeLessThanOrEqual(0);
    }
  });
});
