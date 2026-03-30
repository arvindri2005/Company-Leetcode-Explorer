/**
 * @fileoverview Defines the root layout for the entire application.
 *
 * This component wraps every page, providing a consistent structure that includes
 * the header, theme provider, authentication context, and other global providers.
 * It also sets up global fonts, metadata, and analytics scripts. This is the
 * top-level layout as per the Next.js App Router conventions.
 */
import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { env } from "@/env";
import { CooldownStateProvider } from "@/features/ai";
import { Footer } from "@/features/landing";
import { AuthProvider } from "@/providers";
import { ThemeProvider } from "@/providers";
import { HeaderErrorFallback } from "@/shared/components/layout/header";
import Header from "@/shared/components/layout/header";
import StructuredData from "@/shared/components/seo/structured-data";
import ErrorBoundary from "@/shared/components/ui/error-boundary";
import { OfflineIndicator } from "@/shared/components/ui/offline-indicator";
import { Toaster } from "@/shared/components/ui/toaster";
import { COLORS } from "@/shared/constants/colors";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = env.NEXT_PUBLIC_APP_URL;

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Byte to Offer",
  url: APP_URL,
  logo: `${APP_URL}/icon.png`,
  description:
    "Master coding interviews with AI-driven tools. Explore company-specific problems, generate flashcards, and get personalized prep strategies. Your ultimate hub for targeted coding interview preparation.",
  sameAs: [
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Byte to Offer",
    template: "%s",
  },
  description:
    "Master coding interviews with AI-driven tools. Explore company-specific interview problems (Google, Amazon, Meta, etc.), generate flashcards, and get personalized prep strategies for software engineering roles.",
  applicationName: "Byte to Offer",
  keywords: [
    "LeetCode",
    "Coding Interview Questions",
    "Interview Prep",
    "Google Interview Questions",
    "Amazon Interview Questions",
    "Meta Interview Questions",
    "Microsoft Interview Questions",
    "Software Engineer Interview",
    "Tech Interview",
    "Data Structures",
    "Algorithms",
  ],
  authors: [{ name: "Byte to Offer", url: APP_URL }], // Link to your site or author page
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Byte to Offer",
    description:
      "Your ultimate hub for targeted coding interview preparation. Problem insights, company-specific interview questions, and more.",
    url: APP_URL,
    siteName: "Byte to Offer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Byte to Offer | AI-Powered interview Interview Prep",
    description:
      "Master coding interviews with AI-driven tools for targeted preparation. Explore interview questions for top tech companies.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: COLORS.brand.yellow,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: COLORS.brand.yellow }, // primary color
    { media: "(prefers-color-scheme: dark)", color: COLORS.brand.yellowDark }, // dark mode background
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * The root layout component for the application.
 *
 * This component sets up the basic HTML structure, including `<html>` and `<body>` tags,
 * and applies global fonts. It wraps the page content (`children`) with essential providers:
 * - `ThemeProvider` for light/dark mode management.
 * - `AuthProvider` for handling user authentication state.
 * - `CooldownStateProvider` for managing AI feature usage cooldowns.
 * It also includes the site `Header`, the `Toaster` for notifications, and analytics components.
 *
 * @param {Readonly<{ children: React.ReactNode }>} props - The props for the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout, typically the current page.
 * @returns {JSX.Element} The complete HTML structure for the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistMono.variable}`}>
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="3b720452-7acc-4b71-9ec2-bf707df75aa5"></script>
        <Script
          async
          custom-element="amp-ad"
          src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://cdn.ampproject.org/v0.js"
          strategy="afterInteractive"
        />
        {env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:!fixed focus:top-4 focus:left-4 focus:z-[1000] focus:px-6 focus:py-4 focus:bg-background focus:text-foreground focus:shadow-xl focus:rounded-md focus:border focus:border-primary focus:font-bold focus:outline-none"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CooldownStateProvider>
              <div className="flex flex-col min-h-screen w-full">
                <ErrorBoundary fallback={<HeaderErrorFallback />}>
                   <Header />
                </ErrorBoundary>
                <main id="main-content" tabIndex={-1} className="flex-1 w-full">
                  {children}
                  <SpeedInsights />
                  <Analytics />
                </main>
                <Footer />
                <Toaster />
                <OfflineIndicator />
              </div>
            </CooldownStateProvider>
            <StructuredData data={organizationStructuredData} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}






