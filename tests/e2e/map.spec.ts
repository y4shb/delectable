import { test, expect } from '@playwright/test';
import { MapPage } from './fixtures/page-objects';
import { setupMockedAuth } from './fixtures/auth';
import { mockGoogleMapsAPI } from './helpers/mock-maps';

const mockVenues = [
  {
    id: 'venue-1',
    name: 'SavorWorks Kitchen',
    cuisine_type: 'Italian',
    rating: 9.1,
    latitude: 28.6315,
    longitude: 77.2167,
    reviews_count: 45,
    photo_url: 'https://via.placeholder.com/200',
    location_text: 'Connaught Place',
    tags: ['Fine Dining', 'Date Night'],
  },
  {
    id: 'venue-2',
    name: 'Sakura Sushi',
    cuisine_type: 'Japanese',
    rating: 8.7,
    latitude: 28.5494,
    longitude: 77.2001,
    reviews_count: 32,
    photo_url: 'https://via.placeholder.com/200',
    location_text: 'Hauz Khas',
    tags: ['Sushi', 'Trendy'],
  },
];

async function setupMapMocks(page: import('@playwright/test').Page): Promise<void> {
  // Mock Google Maps API BEFORE navigation
  await mockGoogleMapsAPI(page);
  await setupMockedAuth(page);

  // Mock venues endpoint
  await page.route('**/api/venues/**', async (route) => {
    if (route.request().url().includes('/similar/') || route.request().url().includes('/reviews/')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockVenues),
    });
  });

  // Mock friends venues endpoint
  await page.route('**/api/venues/friends/**', async (route) => {
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

test.describe('Map Page', () => {
  test('map page loads without crashing', async ({ page }) => {
    await setupMapMocks(page);

    const mapPage = new MapPage(page);
    await mapPage.navigate();
    await mapPage.expectMapLoaded();

    // Verify the page is showing map-related UI elements
    // The cuisine filter chips should be visible
    await expect(page.locator('text=Japanese').first()).toBeVisible();
    await expect(page.locator('text=Italian').first()).toBeVisible();

    // The view toggle button should be present (list view switcher)
    await expect(page.getByLabel(/Switch to list view|Switch to map view/)).toBeVisible();

    // Verify venue count indicator is shown
    await expect(page.locator('text=/\\d+ venue/')).toBeVisible();
  });

  test('switching between map and list view works without crash', async ({ page }) => {
    await setupMapMocks(page);

    const mapPage = new MapPage(page);
    await mapPage.navigate();
    await mapPage.expectMapLoaded();

    // Initially in map view, switch to list view
    await mapPage.clickListView();

    // In list view, venue cards should be visible
    await expect(page.locator('text=SavorWorks Kitchen').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Sakura Sushi').first()).toBeVisible();

    // The toggle button should now say "Switch to map view"
    await expect(page.getByLabel('Switch to map view')).toBeVisible();

    // Switch back to map view
    await mapPage.clickMapView();

    // Should not crash and list view button should reappear
    await expect(page.getByLabel('Switch to list view')).toBeVisible();
  });
});
