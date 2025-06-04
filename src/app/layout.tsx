
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { CooldownStateProvider } from '@/hooks/use-ai-cooldown';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Interview Problem Explorer",
  "url": APP_URL,
  "logo": `${APP_URL}/icon.png`, 
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Company Interview Problem Explorer | AI Interview Prep',
    template: '%s | Company Interview Problem Explorer',
  },
  description: 'Master coding interviews with AI-driven tools. Explore company-specific problems, engage in mock interviews, generate flashcards, and get personalized prep strategies.',
  applicationName: 'Company Interview Problem Explorer',
  keywords: ['coding', 'Interview Prep', 'Coding Interview', 'AI Interviewer', 'Company Questions', 'Software Engineer', 'Tech Interview'],
  authors: [{ name: 'Bite to Offer' }],
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Company Interview Problem Explorer | AI-Powered Interview Prep',
    description: 'Your ultimate hub for targeted coding interview preparation. AI mock interviews, problem insights, company-specific questions, and more.',
    url: APP_URL,
    siteName: 'Company Interview Problem Explorer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Company Interview Problem Explorer - AI-Powered Interview Prep',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Company Interview Problem Explorer | AI-Powered Interview Prep',
    description: 'Master coding interviews with AI-driven tools for targeted preparation.',
    images: [`${APP_URL}/og-image.png`],
  },
  icons: {
    icon: [ 
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' }, 
      { url: '/icon.png', type: 'image/png', sizes: '192x192' }, 
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' } 
    ],
    shortcut: ['/favicon.ico'], 
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' } 
    ],
    other: [
       {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg', 
        color: '#F7BC2D', 
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    "script[type=\"application/ld+json\"]": JSON.stringify(organizationStructuredData),
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7BC2D' },
    { media: '(prefers-color-scheme: dark)', color: '#201A13' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CooldownStateProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                  {children}
                  <SpeedInsights/>
                  <Analytics/>
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
