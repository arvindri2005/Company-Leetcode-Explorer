
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL), // Crucial for resolving relative Open Graph image URLs
  title: {
    default: 'Company LeetCode Explorer | AI Interview Prep',
    template: '%s | Company LeetCode Explorer',
  },
  description: 'Master LeetCode interviews with AI-driven tools. Explore company-specific problems, engage in mock interviews, generate flashcards, and get personalized prep strategies.',
  applicationName: 'Company LeetCode Explorer',
  keywords: ['LeetCode', 'Interview Prep', 'Coding Interview', 'AI Interviewer', 'Company Questions', 'Software Engineer', 'Tech Interview'],
  authors: [{ name: 'Firebase Studio AI' }], // You can change this
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Company LeetCode Explorer | AI-Powered Interview Prep',
    description: 'Your ultimate hub for targeted LeetCode interview preparation. AI mock interviews, problem insights, company-specific questions, and more.',
    url: APP_URL,
    siteName: 'Company LeetCode Explorer',
    images: [
      {
        url: '/og-image.png', // Path relative to public folder, resolves to ${APP_URL}/og-image.png
        width: 1200,
        height: 630,
        alt: 'Company LeetCode Explorer - AI-Powered Interview Prep',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Company LeetCode Explorer | AI-Powered Interview Prep',
    description: 'Master LeetCode interviews with AI-driven tools for targeted preparation.',
    images: [`${APP_URL}/og-image.png`], // Must be absolute URL for Twitter
    // site: '@yourtwitterhandle', // Optional: Your Twitter handle
    // creator: '@yourtwitterhandle', // Optional: Content creator's Twitter handle
  },
  icons: {
    icon: '/favicon.ico', // Place favicon.ico in public folder
    shortcut: '/favicon-16x16.png', // Place favicon-16x16.png in public folder
    apple: '/apple-touch-icon.png', // Place apple-touch-icon.png in public folder
    // other: [
    //   { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    // ],
  },
  robots: { // Default robots policy (can be overridden by robots.txt)
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7BC2D' }, // Primary color for light theme
    { media: '(prefers-color-scheme: dark)', color: '#201A13' }, // Background color for dark theme
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  // maximumScale: 1, // Optional: to prevent zooming on mobile
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
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
                <SpeedInsights/>
                <Analytics/>
              </main>
              <Toaster />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
