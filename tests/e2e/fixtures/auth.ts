import { test as base, type Page, type BrowserContext } from '@playwright/test';

/**
 * Test credentials used across E2E tests.
 * These should correspond to seeded users in the test database.
 */
export const TEST_USER = {
  email: 'testuser@delectable.app',
  password: 'TestPass123!',
  name: 'Test User',
};

export const INVALID_USER = {
  email: 'invalid@delectable.app',
  password: 'WrongPassword',
};

export const NEW_USER = {
  email: `newuser+${Date.now()}@delectable.app`,
  password: 'NewPass123!',
  name: 'New Test User',
};

/**
 * Perform login via the UI and store the resulting auth cookies/tokens.
 * Returns after redirect completes.
 */
export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

/**
 * Perform login via API and inject the auth state into the browser context.
 * This is faster than UI-based login for tests that just need an authenticated session.
 */
export async function loginViaAPI(context: BrowserContext, baseURL: string): Promise<string> {
  const response = await context.request.post(`${baseURL}/api/auth/login/`, {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
    },
  });

  if (!response.ok()) {
    throw new Error(`API login failed with status ${response.status()}`);
  }

  const data = await response.json();
  const accessToken = data.access;

  // The refresh token is set as an httpOnly cookie by the backend.
  // The access token needs to be stored so the frontend can use it.
  // We inject it via localStorage or evaluate it in the page context later.
  return accessToken;
}

/**
 * Extended test fixtures that provide an authenticated page.
 */
type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context, baseURL }, use) => {
    try {
      const accessToken = await loginViaAPI(context, baseURL ?? 'http://localhost:3000');

      // Navigate to the app and inject the access token before the app loads
      await page.goto('/login');
      await page.evaluate((token) => {
        // Set the token in a way the app's AuthContext can pick it up.
        // The app uses an in-memory variable, so we need to intercept
        // the refresh call to return our token.
        (window as Record<string, unknown>).__TEST_ACCESS_TOKEN__ = token;
      }, accessToken);

      // Add an interceptor for the refresh endpoint so the app gets our token
      await page.route('**/api/auth/refresh/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access: accessToken }),
        });
      });

      // Navigate to feed (authenticated home)
      await page.goto('/feed');
      await page.waitForLoadState('networkidle');
    } catch {
      // If API login fails (e.g. no backend running), fall back to route mocking
      await setupMockedAuth(page);
    }

    await use(page);
  },
});

/**
 * Set up mocked authentication by intercepting API calls.
 * Use this when the backend is not available.
 */
export async function setupMockedAuth(page: Page): Promise<void> {
  const mockUser = {
    id: 'test-user-1',
    name: TEST_USER.name,
    email: TEST_USER.email,
    avatar_url: 'https://via.placeholder.com/100',
    level: 5,
    completed_wizard: true,
  };

  const mockToken = 'mock-jwt-token-for-testing';

  // Mock the refresh endpoint
  await page.route('**/api/auth/refresh/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: mockToken }),
    });
  });

  // Mock the me endpoint
  await page.route('**/api/auth/me/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  // Mock the login endpoint
  await page.route('**/api/auth/login/', async (route) => {
    const postData = route.request().postDataJSON();
    if (postData?.email === TEST_USER.email && postData?.password === TEST_USER.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: mockToken, user: mockUser }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      });
    }
  });

  // Mock the register endpoint
  await page.route('**/api/auth/register/', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ access: mockToken, user: mockUser }),
    });
  });
}

export { expect } from '@playwright/test';
