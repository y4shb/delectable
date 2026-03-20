import { test, expect } from '@playwright/test';
import { FeedPage } from './fixtures/page-objects';
import { setupMockedAuth } from './fixtures/auth';

// Mock feed data
const mockReviews = [
  {
    id: 'review-1',
    venue: 'SavorWorks',
    venue_id: 'venue-1',
    location: 'Connaught Place, Delhi',
    dish: 'Truffle Pasta',
    tags: ['Italian', 'Fine Dining'],
    user: { id: 'user-1', name: 'Alice', avatar_url: 'https://via.placeholder.com/100' },
    rating: 9.2,
    text: 'Absolutely incredible truffle pasta. Best in the city.',
    photo_url: 'https://via.placeholder.com/400x500',
    date: '2h ago',
    like_count: 42,
    comment_count: 5,
    is_liked: false,
    is_bookmarked: false,
  },
  {
    id: 'review-2',
    venue: 'Sakura Sushi',
    venue_id: 'venue-2',
    location: 'Hauz Khas, Delhi',
    dish: 'Omakase Set',
    tags: ['Japanese', 'Sushi'],
    user: { id: 'user-2', name: 'Bob', avatar_url: 'https://via.placeholder.com/100' },
    rating: 8.7,
    text: 'Great omakase experience with fresh fish.',
    photo_url: 'https://via.placeholder.com/400x500',
    date: '5h ago',
    like_count: 23,
    comment_count: 2,
    is_liked: false,
    is_bookmarked: false,
  },
];

async function setupFeedMocks(page: import('@playwright/test').Page): Promise<void> {
  await setupMockedAuth(page);

  // Mock feed reviews endpoint
  await page.route('**/api/reviews/feed/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockReviews),
    });
  });

  // Mock feed tier endpoint
  await page.route('**/api/feed/tier/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tier: 3, review_count: 25 }),
    });
  });

  // Mock taste profile endpoint
  await page.route('**/api/taste-profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ completed_wizard: true, cuisines: ['Italian', 'Japanese'] }),
    });
  });

  // Mock like/unlike endpoints
  await page.route('**/api/reviews/*/like/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/reviews/*/unlike/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('Feed Page', () => {
  test('anonymous user sees feed redirected to login', async ({ page }) => {
    // Without auth mocks, the page should redirect to login
    // Mock refresh to fail (simulating no session)
    await page.route('**/api/auth/refresh/', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No valid refresh token' }),
      });
    });

    await page.goto('/feed');

    // Feed uses useRequireAuth which redirects to /login
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('authenticated user sees personalized feed with tabs', async ({ page }) => {
    await setupFeedMocks(page);

    const feedPage = new FeedPage(page);
    await feedPage.navigate();
    await feedPage.waitForReviews();

    // Verify the feed tabs are visible
    await expect(page.locator('#tab-top-picks')).toBeVisible();
    await expect(page.locator('#tab-recent')).toBeVisible();
    await expect(page.locator('#tab-explore')).toBeVisible();

    // Verify review cards are rendered
    const reviewCount = await feedPage.getReviewCount();
    expect(reviewCount).toBeGreaterThan(0);

    // Verify welcome section is present
    await expect(page.locator('text=Hi ')).toBeVisible();
  });

  test('like a review shows optimistic UI update', async ({ page }) => {
    await setupFeedMocks(page);

    const feedPage = new FeedPage(page);
    await feedPage.navigate();
    await feedPage.waitForReviews();

    // Find the first review card's like button
    const firstCard = page.locator('[id^="review-card-"]').first();
    await firstCard.scrollIntoViewIfNeeded();

    // Hover over the card to make the action buttons visible
    await firstCard.hover();

    // Find and click the Like button
    const likeButton = firstCard.getByRole('button', { name: 'Like' });
    await likeButton.click();

    // After clicking like, the icon should change to "Unlike" (filled heart)
    await expect(firstCard.getByRole('button', { name: 'Unlike' })).toBeVisible({ timeout: 3000 });
  });
});
