/**
 * @fileoverview Defines the Privacy Policy page for the application.
 *
 * This file contains a static Next.js page component that displays the
 * company's privacy policy. It includes metadata to inform search engines
 * not to index this page.
 */
import Footer from "@/components/landing/footer";
import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

/**
 * Metadata for the Privacy Policy page.
 *
 * This object provides SEO information and explicitly tells search engine robots
 * not to index or follow links on this page.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Privacy Policy | Byte To Offer",
  description: "Privacy Policy for Byte To Offer.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${APP_URL}/privacy-policy`,
  },
};

/**
 * Renders the static Privacy Policy page.
 *
 * This component displays the full text of the website's privacy policy,
 * formatted for readability. It includes sections on data collection, use,
 * security, user rights, and contact information.
 *
 * @returns {JSX.Element} The rendered Privacy Policy page.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-muted-foreground">
          Last updated: July 26, 2024
        </p>

        <div className="mt-8 prose prose-lg max-w-none">
          <p>
            Welcome to Byte To Offer (&quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;). We are committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our website and services
            (collectively, the &quot;Services&quot;).
          </p>

          <h2 className="mt-8 text-2xl font-bold">1. Information We Collect</h2>
          <p>
            We may collect personal information that you voluntarily provide to
            us when you register for an account, use our Services, or contact
            us. This may include:
          </p>
          <ul>
            <li>
              <strong>Personal Identification Information:</strong> Name, email
              address, and profile picture.
            </li>
            <li>
              <strong>User Content:</strong> Any information you provide while
              using our AI-powered features, such as problem-solving notes.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use the
              Services, such as the features you use, the pages you visit, and
              the time and date of your visits.
            </li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold">
            2. How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain our Services.</li>
            <li>Improve, personalize, and expand our Services.</li>
            <li>Understand and analyze how you use our Services.</li>
            <li>
              Develop new products, services, features, and functionality.
            </li>
            <li>
              Communicate with you, either directly or through one of our
              partners, including for customer service, to provide you with
              updates and other information relating to the website, and for
              marketing and promotional purposes.
            </li>
            <li>Process your transactions.</li>
            <li>Find and prevent fraud.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold">
            3. Data Sharing and Disclosure
          </h2>
          <p>
            We do not sell your personal information. We may share your
            information in the following situations:
          </p>
          <ul>
            <li>
              <strong>With Service Providers:</strong> We may share your
              information with third-party vendors and service providers that
              perform services for us or on our behalf.
            </li>
            <li>
              <strong>For Legal Reasons:</strong> We may share your information
              when we believe it is necessary to comply with a legal obligation,
              protect our rights or property, or prevent illegal activities.
            </li>
            <li>
              <strong>With Your Consent:</strong> We may disclose your personal
              information for any other purpose with your consent.
            </li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold">4. Data Security</h2>
          <p>
            We use administrative, technical, and physical security measures to
            help protect your personal information. While we have taken
            reasonable steps to secure the personal information you provide to
            us, please be aware that despite our efforts, no security measures
            are perfect or impenetrable, and no method of data transmission can
            be guaranteed against any interception or other type of misuse.
          </p>

          <h2 className="mt-8 text-2xl font-bold">
            5. Your Data Protection Rights
          </h2>
          <p>
            Depending on your location, you may have the following rights
            regarding your personal information:
          </p>
          <ul>
            <li>
              The right to access – You have the right to request copies of your
              personal data.
            </li>
            <li>
              The right to rectification – You have the right to request that we
              correct any information you believe is inaccurate or complete
              information you believe is incomplete.
            </li>
            <li>
              The right to erasure – You have the right to request that we erase
              your personal data, under certain conditions.
            </li>
            <li>
              The right to restrict processing – You have the right to request
              that we restrict the processing of your personal data, under
              certain conditions.
            </li>
            <li>
              The right to object to processing – You have the right to object
              to our processing of your personal data, under certain conditions.
            </li>
            <li>
              The right to data portability – You have the right to request that
              we transfer the data that we have collected to another
              organization, or directly to you, under certain conditions.
            </li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold">
            6. Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            You are advised to review this Privacy Policy periodically for any
            changes.
          </p>

          <h2 className="mt-8 text-2xl font-bold">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
