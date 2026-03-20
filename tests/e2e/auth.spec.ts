import { test, expect } from '@playwright/test';
import { LoginPage } from './fixtures/page-objects';
import { TEST_USER, INVALID_USER, NEW_USER, setupMockedAuth } from './fixtures/auth';

test.describe('Authentication', () => {
  test('login with valid credentials redirects to feed', async ({ page }) => {
    // Set up mocked auth endpoints
    await setupMockedAuth(page);

    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill in valid credentials
    await loginPage.fillEmail(TEST_USER.email);
    await loginPage.fillPassword(TEST_USER.password);
    await loginPage.submit();

    // Should redirect to /feed after successful login
    await loginPage.expectRedirect('/feed');
  });

  test('login with invalid credentials shows error message', async ({ page }) => {
    // Set up mocked auth endpoints (will reject invalid credentials)
    await setupMockedAuth(page);

    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill in invalid credentials
    await loginPage.fillEmail(INVALID_USER.email);
    await loginPage.fillPassword(INVALID_USER.password);
    await loginPage.submit();

    // Should show error message and stay on login page
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('register new account redirects to onboarding', async ({ page }) => {
    // Set up mocked auth endpoints
    await setupMockedAuth(page);

    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Switch to sign-up mode
    await loginPage.switchToSignUp();

    // Fill in registration form
    await loginPage.fillSignUpForm(
      NEW_USER.name,
      NEW_USER.email,
      NEW_USER.password,
    );

    // Submit registration
    await loginPage.submitSignUp();

    // Should redirect to /onboarding for new users
    await loginPage.expectRedirect('/onboarding');
  });
});
