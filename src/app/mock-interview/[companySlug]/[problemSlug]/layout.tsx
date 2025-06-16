import { getProblemByCompanySlugAndProblemSlug, getCompanyBySlug } from '@/lib/data';
import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

interface MockInterviewLayoutProps {
  params: { companySlug: string; problemSlug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: MockInterviewLayoutProps): Promise<Metadata> {
  try {
    // Get the canonical URL pointing to the problem page instead of mock interview
    const canonicalUrl = `${APP_URL}/company/${params.companySlug}/problem/${params.problemSlug}`;

    // First return a basic metadata object that we'll enhance if we can get the full data
    const baseMetadata: Metadata = {
      title: 'Mock Interview',
      description: 'Practice coding interview with AI interviewer',
      robots: {
        index: false, // Don't index mock interview pages to prevent duplicate content
        follow: true, // Allow following links
      },
      alternates: {
        canonical: canonicalUrl, // Always set the canonical URL
      }
    };

    // Try to get the full company and problem data
    const company = await getCompanyBySlug(params.companySlug);
    const problem = await getProblemByCompanySlugAndProblemSlug(params.companySlug, params.problemSlug);

    // If we don't have both company and problem data, return the base metadata
    if (!company || !problem) {
      return {
        ...baseMetadata,
        title: 'Problem Not Found | Mock Interview',
        description: 'The requested mock interview problem could not be found.',
      };
    }

    // If we have the data, return enhanced metadata
    const pageTitle = `${problem.title} - ${company.name} Mock Interview | Practice LeetCode`;
    const pageDescription = `Practice "${problem.title}" with AI mock interviewer. Commonly asked in ${company.name} technical interviews. Difficulty: ${problem.difficulty}. Interactive coding practice with real-time feedback.`;

    return {
      ...baseMetadata,
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
      }
    };
  } catch (error) {
    // In case of any error, return safe metadata with noindex
    return {
      title: 'Error | Mock Interview',
      description: 'There was an error loading the mock interview.',
      robots: { index: false, follow: true },
      alternates: {
        canonical: `${APP_URL}/company/${params.companySlug}/problem/${params.problemSlug}`,
      }
    };
  }
}

export default function MockInterviewLayout({
  children,
}: MockInterviewLayoutProps) {
  return children;
}
