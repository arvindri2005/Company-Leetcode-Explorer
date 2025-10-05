import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { CooldownStateProvider } from "@/hooks/use-ai-cooldown";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap", // Explicitly set swap
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap", // Explicitly set swap
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Byte to Offer",
    url: APP_URL,
    logo: `${APP_URL}/icon.png`,
    description:
        "Master coding interviews with AI-driven tools. Explore company-specific problems, engage in mock interviews, generate flashcards, and get personalized prep strategies. Your ultimate hub for targeted coding interview preparation.",
    sameAs: [
        // Add social media or other relevant profiles if available
        // "https://www.facebook.com/YourPage",
        // "https://www.twitter.com/YourHandle",
        // "https://www.linkedin.com/company/YourCompany"
    ],
};

export const metadata: Metadata = {
    metadataBase: new URL(APP_URL),
    title: {
        default: "Byte To offer",
        template: "%s",
    },
    description:
        "Master coding interviews with AI-driven tools. Explore company-specific interview problems (Google, Amazon, Meta, etc.), engage in mock interviews, generate flashcards, and get personalized prep strategies for software engineering roles.",
    applicationName: "Byte to Offer",
    keywords: [
        "LeetCode",
        "Coding Interview Questions",
        "Interview Prep",
        "AI Interviewer",
        "Google Interview Questions",
        "Amazon Interview Questions",
        "Meta Interview Questions",
        "Microsoft Interview Questions",
        "Software Engineer Interview",
        "Tech Interview",
        "Data Structures",
        "Algorithms",
    ],
    authors: [{ name: "Bite to Offer", url: APP_URL }], // Link to your site or author page
    manifest: "/site.webmanifest",
    openGraph: {
        title: "Byte to Offer",
        description:
            "Your ultimate hub for targeted coding interview preparation. AI mock interviews, problem insights, company-specific interview questions, and more.",
        url: APP_URL,
        siteName: "Byte to Offer",
        images: [
            {
                url: "/og-image.png", // Ensure this image exists in /public
                width: 1200,
                height: 630,
                alt: "Byte to Offer - AI-Powered Interview Prep for Software Engineers",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Byte to Offer | AI-Powered interview Interview Prep",
        description:
            "Master coding interviews with AI-driven tools for targeted preparation. Explore interview questions for top tech companies.",
        images: [`${APP_URL}/og-image.png`], // Ensure this image exists
        // site: '@YourTwitterHandle', // Add if you have a Twitter handle for the app
        // creator: '@YourTwitterHandle', // Add if you have a Twitter handle for the creator
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
                color: "#F7BC2D",
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
    other: {
        'script[type="application/ld+json"]': JSON.stringify(
            organizationStructuredData
        ),
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#F7BC2D" }, // primary color
        { media: "(prefers-color-scheme: dark)", color: "#201A13" }, // dark mode background
    ],
    colorScheme: "light dark",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <head>
                <script
                    async
                    custom-element="amp-ad"
                    src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"
                ></script>
                <script
                    async
                    src="https://cdn.ampproject.org/v0.js"
                ></script>
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6342943619826199"
                    crossOrigin="anonymous"
                ></script>
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
                suppressHydrationWarning
            >
                <script>
                    (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <CooldownStateProvider>
                            <div className="flex flex-col min-h-screen w-full">
                                <Header />
                                <main className="pt-20">
                                    {children}
                                    <SpeedInsights />
                                    <Analytics />
                                </main>
                                <Toaster />
                            </div>
                        </CooldownStateProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
