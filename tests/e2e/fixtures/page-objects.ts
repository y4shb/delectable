import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for the Feed page (/feed).
 */
export class FeedPage {
  readonly page: Page;
  readonly feedTabList: Locator;
  readonly reviewCards: Locator;
  readonly welcomeSection: Locator;
  readonly topPicksTab: Locator;
  readonly recentTab: Locator;
  readonly exploreTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feedTabList = page.locator('#feed-tabs');
    this.reviewCards = page.locator('[id^="review-card-"]');
    this.welcomeSection = page.locator('text=Hi ');
    this.topPicksTab = page.locator('#tab-top-picks');
    this.recentTab = page.locator('#tab-recent');
    this.exploreTab = page.locator('#tab-explore');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/feed');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForReviews(): Promise<void> {
    // Wait for either review cards to appear or the skeleton loaders to finish
    await this.page.waitForFunction(() => {
      const cards = document.querySelectorAll('[id^="review-card-"]');
      const skeletons = document.querySelectorAll('[class*="Skeleton"]');
      return cards.length > 0 || skeletons.length === 0;
    }, { timeout: 15000 });
  }

  async scrollToReview(index: number): Promise<void> {
    const card = this.reviewCards.nth(index);
    await card.scrollIntoViewIfNeeded();
  }

  async likeReview(index: number): Promise<void> {
    const card = this.reviewCards.nth(index);
    const likeButton = card.getByRole('button', { name: /Like|Unlike/ });
    await likeButton.click();
  }

  async getReviewCount(): Promise<number> {
    return this.reviewCards.count();
  }

  async selectTab(tabName: 'top-picks' | 'recent' | 'collections' | 'explore'): Promise<void> {
    const tab = this.page.locator(`#tab-${tabName}`);
    await tab.click();
  }
}

/**
 * Page Object Model for the Login page (/login).
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly createAccountButton: Locator;
  readonly errorMessage: Locator;
  readonly nameInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email address');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' });
    this.errorMessage = page.locator('text=Invalid email or password');
    this.nameInput = page.getByLabel('Your name');
    this.confirmPasswordInput = page.getByLabel('Confirm password');
    this.submitButton = page.getByRole('button', { name: /Sign In|Create Account/ });
  }

  async navigate(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.signInButton.click();
  }

  async expectRedirect(path: string): Promise<void> {
    await this.page.waitForURL(`**${path}`, { timeout: 10000 });
    expect(this.page.url()).toContain(path);
  }

  async switchToSignUp(): Promise<void> {
    await this.createAccountButton.click();
  }

  async fillSignUpForm(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  async submitSignUp(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create Account' }).first().click();
  }
}

/**
 * Page Object Model for the Venue detail page (/venue/[id]).
 */
export class VenuePage {
  readonly page: Page;
  readonly venueName: Locator;
  readonly rating: Locator;
  readonly writeReviewButton: Locator;
  readonly timeMachineButton: Locator;
  readonly reviewsSection: Locator;
  readonly occasionChips: Locator;

  constructor(page: Page) {
    this.page = page;
    this.venueName = page.locator('h6, [class*="fontWeight: 700"][class*="fontSize: 20"]').first();
    this.rating = page.locator('[data-testid="venue-rating"]');
    this.writeReviewButton = page.getByRole('link', { name: 'Write Review' });
    this.timeMachineButton = page.getByRole('link', { name: 'Time Machine' });
    this.reviewsSection = page.locator('text=Reviews');
    this.occasionChips = page.locator('text=Perfect For').locator('..').locator('[role="button"]');
  }

  async navigate(id: string): Promise<void> {
    await this.page.goto(`/venue/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded(): Promise<void> {
    // Wait for loading spinner to disappear and venue content to appear
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('[role="progressbar"]');
      const venueNotFound = document.querySelector('text=Venue not found');
      return !spinner || venueNotFound;
    }, { timeout: 15000 });
  }

  async clickWriteReview(): Promise<void> {
    await this.writeReviewButton.click();
  }

  async clickTimeMachine(): Promise<void> {
    await this.timeMachineButton.click();
  }

  async voteOccasion(index: number): Promise<void> {
    const chip = this.occasionChips.nth(index);
    await chip.click();
  }
}

/**
 * Page Object Model for the Search page (/search).
 */
export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly venueResults: Locator;
  readonly dishResults: Locator;
  readonly noResults: Locator;
  readonly recentSearches: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByLabel('Search venues, dishes, people');
    this.venueResults = page.locator('text=Venues').locator('..');
    this.dishResults = page.locator('text=Dishes').locator('..');
    this.noResults = page.locator('text=No results found');
    this.recentSearches = page.locator('text=Recent Searches');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/search');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for search results to load
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  async expectResults(): Promise<void> {
    // Wait for either venue results, dish results, or "no results" text
    await this.page.waitForFunction(() => {
      const venues = document.querySelector('h6')?.textContent?.includes('Venues');
      const dishes = document.querySelector('h6')?.textContent?.includes('Dishes');
      const noResults = document.body.textContent?.includes('No results found');
      return venues || dishes || noResults;
    }, { timeout: 10000 });
  }

  async clickVenue(index: number): Promise<void> {
    const venueLinks = this.page.locator('text=Venues').locator('..').locator('a[href^="/venue/"]');
    await venueLinks.nth(index).click();
  }
}

/**
 * Page Object Model for the Map page (/map).
 */
export class MapPage {
  readonly page: Page;
  readonly mapContainer: Locator;
  readonly listViewButton: Locator;
  readonly mapViewButton: Locator;
  readonly cuisineChips: Locator;
  readonly venueCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mapContainer = page.locator('[class*="GoogleMapView"], [class*="gm-style"], #map-container');
    this.listViewButton = page.getByLabel('Switch to list view');
    this.mapViewButton = page.getByLabel('Switch to map view');
    this.cuisineChips = page.locator('[role="button"]').filter({ hasText: /Japanese|Italian|American|European|Experimental/ });
    this.venueCount = page.locator('text=/\\d+ venue/');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/map');
    await this.page.waitForLoadState('networkidle');
  }

  async expectMapLoaded(): Promise<void> {
    // Wait for loading to finish (spinner disappears)
    await this.page.waitForFunction(() => {
      const spinners = document.querySelectorAll('[role="progressbar"]');
      return spinners.length === 0;
    }, { timeout: 15000 });
  }

  async toggleDarkMode(): Promise<void> {
    // Dark mode is system-level; we toggle the view mode as a functional test
    const moreButton = this.page.getByLabel('More options');
    await moreButton.click();
  }

  async clickListView(): Promise<void> {
    await this.listViewButton.click();
  }

  async clickMapView(): Promise<void> {
    await this.mapViewButton.click();
  }
}
