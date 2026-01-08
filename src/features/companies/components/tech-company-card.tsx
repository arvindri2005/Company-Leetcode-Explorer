import React from "react";
import Link from "next/link";
import { Company } from "@/features/companies/types";
import { getLogoUrl } from "@/lib/utils";
import { OfflineImage } from "@/components/ui/offline-image";

interface TechCompanyCardProps {
  company: Company;
  priority?: boolean;
}

export function TechCompanyCard({ company, priority = false }: TechCompanyCardProps) {
  const imgSrc = getLogoUrl(company.logo) || "/icon.png";

  return (
    <div className="relative bg-brand-surface border border-white/5 rounded-xl p-6 flex items-start gap-4 hover:border-white/10 transition-colors group">
      <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded-xl p-2 flex items-center justify-center overflow-hidden">
        <OfflineImage
          src={imgSrc}
          fallbackSrc="/icon.png"
          alt={`${company.name} logo`}
          width={48}
          height={48}
          className="object-contain"
          priority={priority}
        />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors capitalize">
            {company.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {company.description ||
              `Leading tech company with ${company.problemCount} interview questions available.`}
          </p>
        </div>
        <Link
          href={`/company/${company.slug}`}
          className="inline-block text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-md transition-colors after:absolute after:inset-0 after:z-10"
        >
          View
        </Link>
      </div>
    </div>
  );
}
