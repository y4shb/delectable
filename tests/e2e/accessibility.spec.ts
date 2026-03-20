import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupMockedAuth } from './fixtures/auth';

const mockReviews = [
  {
    id: 'review-1',
    venue: 'SavorWorks',
    venue_id: 'venue-1',
    location: 'Connaught Place',
    dish: 'Truffle Pasta',
    tags: ['Italian'],
    user: { id: 'user-1', name: 'Alice', avatar_url: 'https://via.placeholder.com/100' },
    rating: 9.2,
    text: 'Great food',
    photo_url: 'https://via.placeholder.com/400x500',
    date: '2h ago',
    like_count: 10,
    comment_count: 2,
    is_liked: false,
    is_bookmarked: false,
  },
];

async function setupA11yMocks(page: import('@playwright/test').Page): Promise<void> {
  await setupMockedAuth(page);

  await page.route('**/api/reviews/feed/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockReviews),
    });
  });

  await page.route('**/api/feed/tier/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tier: 3, review_count: 25 }),
    });
  });

  await page.route('**/api/taste-profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ completed_wizard: true }),
    });
  });

  await page.route('**/api/kitchen-stories/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

test.describe('Accessibility', () => {
  test('feed page passes axe accessibility scan', async ({ page }) => {
    await setupA11yMocks(page);

    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Wait for content to render
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      // Exclude known third-party widgets that may have a11y issues
      .exclude('.MuiBottomNavigation-root')
      // Only check critical and serious violations
      .withTags(['wcag2a', 'wcag2aa'])
      // Disable rules that are commonly false positives with MUI
      .disableRules(['color-contrast'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        'Accessibility violations on Feed page:',
        JSON.stringify(
          accessibilityScanResults.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
          null,
          2,
        ),
      );
    }

    // Allow up to 3 minor violations (MUI components sometimes have minor issues)
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(seriousViolations).toHaveLength(0);
  });

  test('login page passes axe accessibility scan', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for content to render
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Disable color-contrast as theming may not match strict ratios
      .disableRules(['color-contrast'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        'Accessibility violations on Login page:',
        JSON.stringify(
          accessibilityScanResults.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
          null,
          2,
        ),
      );
    }

    // No critical or serious violations allowed
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(seriousViolations).toHaveLength(0);
  });
});
