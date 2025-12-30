/**
 * @fileoverview Defines the Terms of Service page for the application.
 *
 * This file contains a static Next.js page component that displays the
 * website's terms of service. It includes metadata to inform search engines
 * not to index this page.
 */
import Footer from "@/components/landing/footer";
import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

/**
 * Metadata for the Terms of Service page.
 *
 * This object provides SEO information and explicitly tells search engine robots
 * not to index or follow links on this page.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Terms of Service | Byte To Offer",
  description: "Terms of Service for Byte To Offer.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${APP_URL}/terms-of-service`,
  },
};

/**
 * Renders the static Terms of Service page.
 *
 * This component displays the full text of the website's terms of service,
 * formatted for readability. It covers user responsibilities, intellectual
 * property rights, disclaimers, and other legal notices.
 *
 * @returns {JSX.Element} The rendered Terms of Service page.
 */
export default function TermsOfServicePage() {
  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
          Terms of Service
        </h1>
        <p className="mt-4 text-muted-foreground">
          Last updated: July 26, 2024
        </p>

        <div className="mt-8 prose prose-lg max-w-none">
          <h2 className="mt-8 text-2xl font-bold text-balance">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Byte To Offer website and services
            (collectively, the &quot;Services&quot;), you agree to be bound by
            these Terms of Service (&quot;Terms&quot;). If you do not agree to
            these Terms, you may not use the Services.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-balance">2. Use of Services</h2>
          <p>
            You agree to use the Services only for lawful purposes and in
            accordance with these Terms. You agree not to use the Services:
          </p>
          <ul>
            <li>
              In any way that violates any applicable federal, state, local, or
              international law or regulation.
            </li>
            <li>
              For the purpose of exploiting, harming, or attempting to exploit
              or harm minors in any way by exposing them to inappropriate
              content, asking for personally identifiable information, or
              otherwise.
            </li>
            <li>
              To transmit, or procure the sending of, any advertising or
              promotional material, including any &quot;junk mail,&quot;
              &quot;chain letter,&quot; &quot;spam,&quot; or any other similar
              solicitation.
            </li>
            <li>
              To impersonate or attempt to impersonate Byte To Offer, a Byte To
              Offer employee, another user, or any other person or entity.
            </li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-balance">
            3. Intellectual Property Rights
          </h2>
          <p>
            The Services and their entire contents, features, and functionality
            (including but not limited to all information, software, text,
            displays, images, video, and audio, and the design, selection, and
            arrangement thereof) are owned by Byte To Offer, its licensors, or
            other providers of such material and are protected by United States
            and international copyright, trademark, patent, trade secret, and
            other intellectual property or proprietary rights laws.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-balance">
            4. Disclaimer of Warranties
          </h2>
          <p>
            The Services are provided on an &quot;as is&quot; and &quot;as
            available&quot; basis. Byte To Offer makes no representations or
            warranties of any kind, express or implied, as to the operation of
            the Services or the information, content, materials, or products
            included on the Services. You expressly agree that your use of the
            Services is at your sole risk.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-balance">
            5. Limitation of Liability
          </h2>
          <p>
            In no event shall Byte To Offer, its affiliates, or their licensors,
            service providers, employees, agents, officers, or directors be
            liable for damages of any kind, under any legal theory, arising out
            of or in connection with your use, or inability to use, the
            Services, any websites linked to it, any content on the Services, or
            such other websites, including any direct, indirect, special,
            incidental, consequential, or punitive damages, including but not
            limited to, personal injury, pain and suffering, emotional distress,
            loss of revenue, loss of profits, loss of business or anticipated
            savings, loss of use, loss of goodwill, loss of data, and whether
            caused by tort (including negligence), breach of contract, or
            otherwise, even if foreseeable.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-balance">6. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the State of Delaware, without giving effect to any
            choice or conflict of law provision or rule.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-balance">7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, we will provide
            at least 30 days' notice prior to any new terms taking effect. What
            constitutes a material change will be determined at our sole
            discretion.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-balance">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please{" "}
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
