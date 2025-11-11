/**
 * @fileoverview Defines a completely redesigned, modern header component for displaying company information.
 *
 * This component renders a visually striking header section for a company,
 * featuring its logo, name, website, and a brief description. It's designed
 * with a modern aesthetic to create a strong visual anchor for the page.
 */
import type { Company } from "@/types";
import { Building2, ExternalLink } from "lucide-react";
import Image from "next/image";

/**
 * Props for the CompanyHeaderV3 component.
 */
interface CompanyHeaderV3Props {
  company: Company;
}

/**
 * Renders a visually striking and modern header for a specific company.
 *
 * This component features a clean, spacious design with a prominent logo,
 * bold typography, and subtle animations. It aims to create a professional
 * and engaging introduction to the company's page.
 *
 * @param {CompanyHeaderV3Props} props - The props for the component.
 * @returns {JSX.Element} The rendered company header section.
 */
export default function CompanyHeaderV3({ company }: CompanyHeaderV3Props) {
  return (
    <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 border border-border rounded-xl p-8 mb-8 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="relative h-24 w-24 flex-shrink-0 border-4 border-white/10 rounded-full shadow-lg">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={`${company.name} Logo`}
              fill
              className="rounded-full object-contain bg-white p-2"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-700 rounded-full">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            {company.name}
          </h1>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-sky-400 hover:text-sky-300 transition-colors mt-2"
            >
              {company.website}
              <ExternalLink className="h-4 w-4 ml-1.5" />
            </a>
          )}
          {company.description && (
            <p className="mt-4 text-gray-300 max-w-2xl">
              {company.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
