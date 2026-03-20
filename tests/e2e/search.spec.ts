import { test, expect } from '@playwright/test';
import { SearchPage } from './fixtures/page-objects';
import { setupMockedAuth } from './fixtures/auth';

const mockSearchResults = {
  venues: [
    {
      id: 'venue-1',
      name: 'SavorWorks Kitchen',
      cuisine_type: 'Italian',
      rating: 9.1,
      photo_url: 'https://via.placeholder.com/100',
      location_text: 'Connaught Place',
    },
    {
      id: 'venue-2',
      name: 'Sakura Sushi Bar',
      cuisine_type: 'Japanese',
      rating: 8.7,
      photo_url: 'https://via.placeholder.com/100',
      location_text: 'Hauz Khas',
    },
  ],
  reviews: [],
  dishes: [],
};

const mockDishResults = {
  venues: [],
  reviews: [],
  dishes: [
    {
      id: 'dish-1',
      name: 'Truffle Pasta',
      avg_rating: 9.5,
      category: 'Pasta',
      venue_detail: { id: 'venue-1', name: 'SavorWorks Kitchen' },
    },
    {
      id: 'dish-2',
      name: 'Margherita Pizza',
      avg_rating: 8.8,
      category: 'Pizza',
      venue_detail: { id: 'venue-1', name: 'SavorWorks Kitchen' },
    },
  ],
};

async function setupSearchMocks(
  page: import('@playwright/test').Page,
  responseData: object = mockSearchResults,
): Promise<void> {
  await setupMockedAuth(page);

  // Mock search endpoint
  await page.route('**/api/search/**', async (route) => {
    const url = route.request().url();
    // Check if query contains "pasta" or "dish" keywords for dish results
    if (url.includes('pasta') || url.includes('Pasta') || url.includes('dish')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDishResults),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData),
      });
    }
  });

  // Mock suggested users endpoint
  await page.route('**/api/users/suggested/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock occasions endpoint
  await page.route('**/api/occasions/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

test.describe('Search Page', () => {
  test('search returns venue results', async ({ page }) => {
    await setupSearchMocks(page);

    const searchPage = new SearchPage(page);
    await searchPage.navigate();

    // Verify the search input is present
    await expect(searchPage.searchInput).toBeVisible();

    // Type a search query
    await searchPage.search('SavorWorks');
    await searchPage.expectResults();

    // Verify venue results section appears
    await expect(page.locator('text=Venues').first()).toBeVisible();

    // Verify venue name appears in results
    await expect(page.locator('text=SavorWorks Kitchen').first()).toBeVisible();

    // Verify cuisine type is shown
    await expect(page.locator('text=Italian').first()).toBeVisible();
  });

  test('search returns dish results', async ({ page }) => {
    await setupSearchMocks(page);

    const searchPage = new SearchPage(page);
    await searchPage.navigate();

    // Search for a dish
    await searchPage.search('pasta');
    await searchPage.expectResults();

    // Verify dishes section appears
    await expect(page.locator('text=Dishes').first()).toBeVisible();

    // Verify dish name appears
    await expect(page.locator('text=Truffle Pasta').first()).toBeVisible();
  });
});
