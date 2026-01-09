import type { Metadata } from "next";
import TypingTestContainer from "@/components/tools/typing-test/typing-test-container";
import StructuredData from "@/components/seo/structured-data";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  title: "Speed Coder - Typing Test for Developers | Byte to Offer",
  description:
    "Improve your coding speed and accuracy with our developer-focused typing test. Practice with real syntax, algorithms, and data structures.",
  keywords: [
    "typing test",
    "coding speed",
    "developer typing",
    "programming practice",
    "speed coder",
    "touch typing",
    "coding interview prep",
  ],
  openGraph: {
    title: "Speed Coder - Typing Test for Developers",
    description:
      "Don't just type random words. Practice with real syntax, algorithms, and data structures.",
    url: "/tools/typing-test",
    siteName: "Byte to Offer",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speed Coder - Typing Test for Developers",
    description:
      "Improve your coding speed and accuracy with our developer-focused typing test.",
  },
  alternates: {
    canonical: "/tools/typing-test",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Speed Coder",
  url: `${APP_URL}/tools/typing-test`,
  description:
    "Improve your coding speed and accuracy with our developer-focused typing test.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  featureList: [
    "Real code syntax practice",
    "Algorithm typing",
    "Data structure patterns",
    "Speed and accuracy tracking",
  ],
};

export default function TypingTestPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl animate-in fade-in slide-in-from-bottom-5 duration-700">
      <StructuredData data={jsonLd} />
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-balance">
          Speed Coder
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Don&apos;t just type random words. Practice with real syntax, algorithms,
          and data structures.
        </p>
      </div>

      <TypingTestContainer />
    </div>
  );
}
