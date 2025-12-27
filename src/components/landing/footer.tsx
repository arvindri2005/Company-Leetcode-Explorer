/**
 * @fileoverview Defines the footer component for the application.
 *
 * This component renders the site's footer, which includes links to important
 * informational pages like the Privacy Policy, Terms of Service, and Contact page,
 * as well as the copyright notice.
 */
export default function Footer() {
  return (
    <footer className="bg-black/50 py-12 px-8 text-center border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center gap-8 mb-8 flex-wrap">
          <a
            href="/privacy-policy"
            className="text-gray-custom-400 no-underline transition-colors duration-300 hover:text-brand-teal"
          >
            Privacy Policy
          </a>
          <a
            href="/terms-of-service"
            className="text-gray-custom-400 no-underline transition-colors duration-300 hover:text-brand-teal"
          >
            Terms of Service
          </a>
          <a
            href="/contact"
            className="text-gray-custom-400 no-underline transition-colors duration-300 hover:text-brand-teal"
          >
            Contact
          </a>
          <a
            href="/blog"
            className="text-gray-custom-400 no-underline transition-colors duration-300 hover:text-brand-teal"
          >
            Blog
          </a>
          <a
            href="/sitemap.xml"
            className="text-gray-custom-400 no-underline transition-colors duration-300 hover:text-brand-teal"
          >
            Sitemap
          </a>
        </div>
        <p className="text-gray-custom-500 mt-8">
          © 2025 Byte to Offer. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
