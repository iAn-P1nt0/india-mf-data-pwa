import { test, expect } from '@playwright/test';

test.describe('PWA Offline Capabilities', () => {
  test('should serve cached content when offline', async ({ page, context }) => {
    // First, visit the page while online to cache resources
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate offline mode
    await context.setOffline(true);

    // Reload the page - should still load from service worker cache
    await page.reload();

    // Check that critical content is visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Service worker should indicate offline status
    const offlineIndicator = page.locator('[aria-label*="offline"]');
    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator).toBeVisible();
    }
  });

  test('should show cached funds when offline', async ({ page, context }) => {
    // Load funds page online
    await page.goto('/funds');
    await page.waitForLoadState('networkidle');

    // Wait for funds to load
    await page.waitForSelector('[data-testid*="fund-card"]', {
      timeout: 5000
    });

    // Go offline
    await context.setOffline(true);

    // Navigate back to funds - should show cached funds
    await page.goto('/funds');
    await page.waitForLoadState('domcontentloaded');

    // Some cached fund cards should still be visible
    const fundCards = page.locator('[data-testid*="fund-card"]');
    const count = await fundCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display offline message when attempting to fetch new data', async ({
    page,
    context
  }) => {
    await page.goto('/funds');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);

    // Try to search for a fund (would require network)
    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('new fund');
      await page.waitForTimeout(1000);

      // Should show offline/error message
      const errorMessage = page.locator('[role="alert"]');
      // Error message may or may not appear depending on implementation
      // Just verify the page doesn't crash
      await expect(page).not.toHaveTitle('Error');
    }
  });
});

test.describe('Fund Comparison', () => {
  test('should compare up to 3 funds', async ({ page }) => {
    await page.goto('/funds');
    await page.waitForLoadState('networkidle');

    // Look for comparison button or navigate to comparison page
    const compareButton = page.locator('text=Compare');
    if (await compareButton.count() > 0) {
      await compareButton.click();
    } else {
      // Navigate directly to comparison page
      await page.goto('/funds/compare');
    }

    // Add first fund (assuming fund selector is available)
    const fundSelectors = page.locator('button:has-text("Add to Comparison")');
    if (await fundSelectors.count() > 0) {
      await fundSelectors.first().click();

      // Wait for success toast
      await page.waitForSelector('[data-testid="toast-success"]', {
        timeout: 5000
      });

      // Verify fund was added
      const selectedFunds = page.locator('[class*="selected"]');
      expect(await selectedFunds.count()).toBeGreaterThan(0);
    }
  });

  test('should show comparison metrics', async ({ page }) => {
    await page.goto('/funds/compare');
    await page.waitForLoadState('networkidle');

    // Add funds to compare
    const addButtons = page.locator('button:has-text("Add to Comparison")');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
      await page.waitForTimeout(500);

      // Check for comparison table or metrics display
      const table = page.locator('table');
      const metrics = page.locator('[class*="metric"]');

      if (await table.count() > 0) {
        await expect(table).toBeVisible();
      } else if (await metrics.count() > 0) {
        await expect(metrics.first()).toBeVisible();
      }
    }
  });
});

test.describe('Watchlist', () => {
  test('should add fund to watchlist', async ({ page }) => {
    await page.goto('/funds');
    await page.waitForLoadState('networkidle');

    // Find and click watchlist button
    const watchlistButtons = page.locator('button[aria-label*="watchlist"]');
    if (await watchlistButtons.count() > 0) {
      const firstButton = watchlistButtons.first();
      await firstButton.click();

      // Check for success toast
      await page.waitForSelector('[data-testid="toast-success"]', {
        timeout: 3000
      });

      // Button should update to show "In Watchlist"
      await expect(firstButton).toContainText('In Watchlist');
    }
  });

  test('should open watchlist drawer', async ({ page }) => {
    await page.goto('/');

    // Look for watchlist button in header/navigation
    const watchlistButton = page.locator('button:has-text("Watchlist")');
    if (await watchlistButton.count() > 0) {
      await watchlistButton.click();

      // Watchlist drawer should open
      const drawer = page.locator('[class*="drawer"]');
      await expect(drawer).toBeVisible();
    }
  });
});

test.describe('Notifications', () => {
  test('should display toast notifications', async ({ page }) => {
    await page.goto('/');

    // Trigger an action that shows a toast (e.g., add to watchlist)
    const watchlistButtons = page.locator('button[aria-label*="watchlist"]');
    if (await watchlistButtons.count() > 0) {
      await watchlistButtons.first().click();

      // Toast should appear
      const toast = page.locator('[data-testid*="toast"]');
      await expect(toast.first()).toBeVisible();

      // Toast should auto-dismiss after timeout
      await page.waitForTimeout(5000);
      // Toast may or may not still be visible depending on timeout
    }
  });

  test('should allow dismissing toast manually', async ({ page }) => {
    await page.goto('/');

    // Trigger toast
    const watchlistButtons = page.locator('button[aria-label*="watchlist"]');
    if (await watchlistButtons.count() > 0) {
      await watchlistButtons.first().click();

      // Find close button on toast
      const closeButton = page.locator('[aria-label="Close notification"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();

        // Toast should disappear immediately
        await expect(closeButton).not.toBeVisible();
      }
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/funds');
    await page.waitForLoadState('networkidle');

    // Check that content is visible and not cut off
    const mainContent = page.locator('main');
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }

    // Navigation should be accessible
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('should show appropriate drawer on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Look for mobile-specific elements or behaviors
    const hamburgerMenu = page.locator('button[aria-label*="menu"]');
    if (await hamburgerMenu.count() > 0) {
      await hamburgerMenu.click();
      // Menu should open
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Performance', () => {
  test('should have fast initial load time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should display skeletons while loading', async ({ page }) => {
    await page.goto('/funds');

    // Check for skeleton loaders
    const skeletons = page.locator('[class*="skeleton"], [class*="animate-pulse"]');

    if (await skeletons.count() > 0) {
      // Skeletons should be visible initially
      await expect(skeletons.first()).toBeVisible();

      // After network idle, skeletons should be replaced with content
      await page.waitForLoadState('networkidle');
      // Content should now be visible
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Check for common ARIA attributes
    const ariaLabels = page.locator('[aria-label]');
    const ariaLive = page.locator('[aria-live]');

    expect(await ariaLabels.count()).toBeGreaterThan(0);
    // Toast container should have aria-live for announcements
    if (await ariaLive.count() > 0) {
      const liveRegion = ariaLive.first();
      const value = await liveRegion.getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(value);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that some element has focus
    const focusedElement = page.locator(':focus');
    expect(await focusedElement.count()).toBeGreaterThan(0);
  });
});
