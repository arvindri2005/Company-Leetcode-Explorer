from playwright.sync_api import Page, expect, sync_playwright

def verify_button_height(page: Page):
    # Go to the test page
    page.goto("http://localhost:9002/test-ui")

    # Set viewport to mobile size (iPhone 12 Pro)
    page.set_viewport_size({"width": 390, "height": 844})

    # Wait for the page to load
    page.wait_for_load_state("networkidle")

    # Get the default button
    button = page.get_by_text("Default Button")

    # Check the computed style height
    box = button.bounding_box()
    print(f"Button height: {box['height']}px")

    # Assert height is 44px (allow small float variance)
    assert abs(box['height'] - 44) < 1, f"Expected button height ~44px, got {box['height']}px"

    print("Verification Passed: Button height is 44px on mobile.")

    # Take a screenshot
    page.screenshot(path=".jules/verification/mobile-button-check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_button_height(page)
        finally:
            browser.close()
