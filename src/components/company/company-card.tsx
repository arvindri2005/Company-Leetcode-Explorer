/**
 * @fileoverview Defines a card component for displaying a summary of a company.
 *
 * This component renders a visually appealing card that shows a company's logo,
 * name, and the number of associated interview problems. It includes a link to
 * the detailed company page. It also has a fallback for broken logo images.
 */
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Company } from "@/types";
import { getLogoUrl } from "@/lib/utils";

/**
 * Props for the CompanyCard component.
 */
interface CompanyCardProps {
  /** The company data to display. */
  company: Company;
}

/**
 * Renders a card with summary information about a company.
 *
 * This component is designed to be used in a grid or list of companies. It displays
 * key information and provides a clear call-to-action to view the company's problems.
 * It includes an error handler for the company logo to show a fallback icon if the
 * image fails to load.
 *
 * @param {CompanyCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered company card.
 */
const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const [imgSrc, setImgSrc] = useState(
    getLogoUrl(company.logo) || "/icon.png"
  );

  return (
    <article className="group relative flex flex-col h-full transition-all duration-300 ease-out overflow-hidden rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg shadow-black/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1">
      <header className="p-4 flex items-center gap-3">
        <Image
          src={imgSrc}
          alt={`${company.name} logo`}
          width={48}
          height={48}
          className="rounded-full border-2 border-white/20 object-contain"
          priority
          onError={() => setImgSrc("/icon.png")}
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-white truncate">
            {company.name}
          </h2>
          <p
            className="flex items-center gap-1.5 text-xs text-white/60"
            aria-label="Problem count"
          >
            <span aria-hidden="true" className="inline-block align-middle mr-1">
              💼
            </span>
            <span className="truncate">
              {company.problemCount} problem
              {company.problemCount !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
      </header>
      <div className="flex-grow" />
      <footer className="p-4 pt-0">
        <Link
          href={`/company/${company.slug}`}
          className="block w-full mt-4 py-2 px-4 h-auto bg-white/10 border border-white/20 text-white/80 rounded-full text-center hover:bg-white/20 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
          aria-label={`View problems for ${company.name}`}
        >
          View Problems
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      </footer>
    </article>
  );
};

export default React.memo(CompanyCard);
