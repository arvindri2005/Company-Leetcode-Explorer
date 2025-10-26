
import re
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:9002/")
    page.screenshot(path="jules-scratch/verification/01_home.png")
    page.get_by_role("link", name="Companies").click()
    page.wait_for_url("http://localhost:9002/companies")
    page.screenshot(path="jules-scratch/verification/02_companies.png")
    page.locator(".company-card a").first.click()
    page.wait_for_url(re.compile(r"/companies/.*"))
    page.screenshot(path="jules-scratch/verification/03_company_page.png")
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
