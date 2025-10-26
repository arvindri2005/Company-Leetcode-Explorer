
import re
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:9002/companies")
    page.screenshot(path="jules-scratch/verification/02_companies_empty.png")
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
