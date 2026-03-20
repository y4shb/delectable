import { test, expect } from '@playwright/test';
import { VenuePage } from './fixtures/page-objects';
import { setupMockedAuth } from './fixtures/auth';

const MOCK_VENUE_ID = 'venue-123';

const mockVenue = {
  id: MOCK_VENUE_ID,
  name: 'SavorWorks Kitchen',
  cuisine_type: 'Italian',
  location_text: 'Connaught Place, New Delhi',
  rating: 9.1,
  reviews_count: 45,
  photo_url: 'https://via.placeholder.com/600x400',
  tags: ['Fine Dining', 'Date Night', 'Romantic'],
  dietary_badges: ['vegetarian', 'gluten-free'],
  dishes: [
    { id: 'dish-1', name: 'Truffle Pasta', avg_rating: 9.5, review_count: 12, category: 'Pasta' },
    { id: 'dish-2', name: 'Margherita Pizza', avg_rating: 8.8, review_count: 20, category: 'Pizza' },
    { id: 'dish-3', name: 'Tiramisu', avg_rating: 9.0, review_count: 8, category: 'Dessert' },
  ],
  occasions: [
    {
      occasion: { slug: 'date-night', label: 'Date Night', emoji: '\u2764\ufe0f' },
      vote_count: 15,
      user_voted: false,
    },
    {
      occasion: { slug: 'celebration', label: 'Celebration', emoji: '\ud83c\udf89' },
      vote_count: 8,
      user_voted: true,
    },
  ],
};

const mockReviews = [
  {
    id: 'rev-1',
    rating: 9.5,
    text: 'Amazing truffle pasta, best I have ever had!',
    photo_url: 'https://via.placeholder.com/400x300',
    user: { id: 'user-1', name: 'Alice Chen', avatar_url: 'https://via.placeholder.com/50' },
    created_at: '2025-01-15T10:30:00Z',
  },
  {
    id: 'rev-2',
    rating: 8.8,
    text: 'Great ambiance and wonderful service.',
    photo_url: 'https://via.placeholder.com/400x300',
    user: { id: 'user-2', name: 'Bob Smith', avatar_url: 'https://via.placeholder.com/50' },
    created_at: '2025-01-10T14:00:00Z',
  },
];

async function setupVenueMocks(page: import('@playwright/test').Page): Promise<void> {
  await setupMockedAuth(page);

  // Mock venue detail endpoint
  await page.route(`**/api/venues/${MOCK_VENUE_ID}/**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVenue),
      });
    } else {
      await route.continue();
    }
  });

  // Mock venue reviews endpoint
  await page.route(`**/api/venues/${MOCK_VENUE_ID}/reviews/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockReviews),
    });
  });

  // Mock similar venues endpoint
  await page.route(`**/api/venues/${MOCK_VENUE_ID}/similar/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock want-to-try endpoint
  await page.route('**/api/want-to-try/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock occasion vote/unvote endpoints
  await page.route(`**/api/venues/${MOCK_VENUE_ID}/occasions/*/vote/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route(`**/api/venues/${MOCK_VENUE_ID}/occasions/*/unvote/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
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
}

test.describe('Venue Detail Page', () => {
  test('venue detail page loads with reviews', async ({ page }) => {
    await setupVenueMocks(page);

    const venuePage = new VenuePage(page);
    await venuePage.navigate(MOCK_VENUE_ID);
    await venuePage.expectLoaded();

    // Verify venue name is displayed
    await expect(page.locator(`text=${mockVenue.name}`)).toBeVisible();

    // Verify rating is displayed
    await expect(page.locator(`text=${Number(mockVenue.rating).toFixed(1)}`).first()).toBeVisible();

    // Verify cuisine type is displayed
    await expect(page.locator(`text=${mockVenue.cuisine_type}`)).toBeVisible();

    // Verify reviews section is present
    await expect(page.locator('text=Reviews').first()).toBeVisible();

    // Verify at least one review is displayed
    await expect(page.locator(`text=${mockReviews[0].user.name}`)).toBeVisible();

    // Verify Write Review button is present
    await expect(page.getByRole('link', { name: 'Write Review' })).toBeVisible();

    // Verify Time Machine button is present
    await expect(page.getByRole('link', { name: 'Time Machine' })).toBeVisible();
  });

  test('occasion voting works with optimistic update', async ({ page }) => {
    await setupVenueMocks(page);

    const venuePage = new VenuePage(page);
    await venuePage.navigate(MOCK_VENUE_ID);
    await venuePage.expectLoaded();

    // Verify "Perfect For" section is present
    await expect(page.locator('text=Perfect For')).toBeVisible();

    // Find the first occasion chip (Date Night) and verify initial vote count
    const dateNightChip = page.locator('text=/Date Night/').first();
    await expect(dateNightChip).toBeVisible();

    // Click the occasion chip to vote
    await dateNightChip.click();

    // After clicking, the vote count should change optimistically
    // The chip should now show an incremented count (15 + 1 = 16)
    await expect(page.locator('text=/Date Night.*16/')).toBeVisible({ timeout: 3000 });
  });

  test('navigate to Time Machine page', async ({ page }) => {
    await setupVenueMocks(page);

    const venuePage = new VenuePage(page);
    await venuePage.navigate(MOCK_VENUE_ID);
    await venuePage.expectLoaded();

    // Click the Time Machine button
    const timeMachineLink = page.getByRole('link', { name: 'Time Machine' });
    await expect(timeMachineLink).toBeVisible();
    await timeMachineLink.click();

    // Should navigate to the timeline page
    await page.waitForURL(`**/venue/${MOCK_VENUE_ID}/timeline`, { timeout: 5000 });
    expect(page.url()).toContain(`/venue/${MOCK_VENUE_ID}/timeline`);
  });
});
