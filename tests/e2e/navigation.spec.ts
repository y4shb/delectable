import { test, expect } from '@playwright/test';
import { setupMockedAuth } from './fixtures/auth';
import { mockGoogleMapsAPI } from './helpers/mock-maps';

async function setupNavigationMocks(page: import('@playwright/test').Page): Promise<void> {
  await mockGoogleMapsAPI(page);
  await setupMockedAuth(page);

  // Mock feed reviews
  await page.route('**/api/reviews/feed/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock feed tier
  await page.route('**/api/feed/tier/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tier: 3, review_count: 25 }),
    });
  });

  // Mock taste profile
  await page.route('**/api/taste-profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ completed_wizard: true }),
    });
  });

  // Mock venues
  await page.route('**/api/venues/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock friends venues
  await page.route('**/api/venues/friends/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock profile
  await page.route('**/api/profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-1',
        name: 'Test User',
        email: 'test@delectable.app',
        avatar_url: 'https://via.placeholder.com/100',
        level: 5,
      }),
    });
  });

  // Mock notifications
  await page.route('**/api/notifications/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], unread_count: 0 }),
    });
  });

  // Mock kitchen stories
  await page.route('**/api/kitchen-stories/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock geolocation
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 28.6304, longitude: 77.2177 });
}

test.describe('Navigation', () => {
  test('bottom tab bar navigates between pages', async ({ page }) => {
    await setupNavigationMocks(page);

    // Start on feed page
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Verify the bottom navigation bar is present
    const bottomNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(bottomNav).toBeVisible();

    // Navigate to Map via bottom tab
    const mapTab = page.locator('#tab-map');
    await mapTab.click();
    await page.waitForURL('**/map', { timeout: 5000 });
    expect(page.url()).toContain('/map');

    // Navigate to Profile via bottom tab
    const profileTab = page.locator('#tab-profile');
    await profileTab.click();
    await page.waitForURL('**/profile', { timeout: 5000 });
    expect(page.url()).toContain('/profile');

    // Navigate back to Feed via bottom tab
    const feedTab = page.locator('#tab-feed');
    await feedTab.click();
    await page.waitForURL('**/feed', { timeout: 5000 });
    expect(page.url()).toContain('/feed');
  });

  test('404 page shows for invalid routes', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');

    // Verify the 404 page content
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator("text=This page doesn't exist")).toBeVisible();

    // Verify the "Go Home" button is present
    const goHomeButton = page.getByRole('link', { name: 'Go Home' });
    await expect(goHomeButton).toBeVisible();

    // Click "Go Home" and verify navigation
    await goHomeButton.click();
    await page.waitForURL('**/', { timeout: 5000 });
  });
});
