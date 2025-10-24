
/**
 * @fileoverview Defines a header component for displaying company information.
 *
 * This component renders a prominent header section for a company, including
 * its logo, name, website, and description. It's typically used at the top of
 * a company's detail page.
 */
import type { Company } from '@/types';
import { Building2 } from 'lucide-react';
import Image from 'next/image';

/**
 * Props for the CompanyHeader component.
 */
interface CompanyHeaderProps {
  /** The company data object to display. */
  company: Company;
}

/**
 * Renders a detailed header for a specific company.
 *
 * This component displays the company's logo (with a fallback icon), name,
 * a clickable link to their website, and their description. It is designed to
 * be a visually distinct and informative block at the top of a page.
 *
 * @param {CompanyHeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered company header section.
 */
export default function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <section className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 flex-shrink-0">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={`${company.name} Logo`}
              fill
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {company.website}
            </a>
          )}
        </div>
      </div>
      {company.description && (
        <p className="mt-4 text-muted-foreground">{company.description}</p>
      )}
    </section>
  );
}
