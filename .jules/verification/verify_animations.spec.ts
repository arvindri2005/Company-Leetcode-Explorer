
import { test, expect } from '@playwright/test';

test('Verify animation and interaction', async ({ page }) => {
  // Navigate to the problems page which should list problems
  await page.goto('http://localhost:3000/problems');

  // Verify the list appears (staggered animation check is hard programmatically, but we can check existence)
  const problemList = page.locator('.space-y-4').first();
  await expect(problemList).toBeVisible();

  // Find the first problem card (using the class we added/modified)
  const firstCard = page.locator('.group').first();
  await expect(firstCard).toBeVisible();

  // Hover over the card to trigger the scale effect (visual check via screenshot)
  await firstCard.hover();

  // Take a screenshot of the hover state
  await page.screenshot({ path: '.jules/verification/hover_state.png' });

  // Click the expand button (using the new aria-label)
  const expandButton = firstCard.getByLabel('Expand');
  await expandButton.click();

  // Wait for the expanded content to be visible (animation duration)
  // The expanded content contains "Write Code", "Similar", "Hints" buttons.
  const similarButton = firstCard.getByRole('button', { name: 'Similar' });
  await expect(similarButton).toBeVisible();

  // Take a screenshot of the expanded state
  await page.screenshot({ path: '.jules/verification/expanded_state.png' });
});
