import React from "react";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { OfflineImage } from "@/components/ui/offline-image";
import { type Company } from "@/features/companies/types";
import { getLogoUrl } from "@/lib/utils";

interface CompanyTableProps {
  companies: Company[];
}

// Memoized to prevent re-renders of the entire table when parent state changes (e.g. loadingMore)but companies data remains stable.
export const CompanyTable = React.memo(function CompanyTable({
  companies,
}: CompanyTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-brand-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400">
              <th className="p-4 font-medium">Company</th>
              <th className="p-4 font-medium hidden md:table-cell">Top Tags</th>
              <th className="p-4 font-medium hidden sm:table-cell">Problems</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {companies.map((company) => (
              <CompanyRow key={company.id} company={company} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Memoized to prevent re-renders of existing rows when new data is appended (infinite scroll)
const CompanyRow = React.memo(function CompanyRow({
  company,
}: {
  company: Company;
}) {
  const imgSrc = getLogoUrl(company.logo) || "/icon.png";

  // Get top 2 tags - Memoized to prevent recalculation and array mutation on render
  const topTags = React.useMemo(() => {
    if (!company.commonTags || company.commonTags.length === 0) {
      return null;
    }
    return [...company.commonTags] // Create a copy before sorting to avoid mutating the original prop
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map((t) => t.tag);
  }, [company.commonTags]);

  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="p-4">
        <Link
          href={`/company/${company.slug}`}
          className="flex items-center gap-3 group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-1 -m-1"
        >
          <div className="relative w-10 h-10 bg-white rounded-lg p-1.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <OfflineImage
              src={imgSrc}
              fallbackSrc="/icon.png"
              alt={`${company.name} logo`}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="font-medium text-white group-hover/link:text-teal-400 transition-colors capitalize">
            {company.name}
          </span>
        </Link>
      </td>
      <td className="p-4 text-gray-400 hidden md:table-cell">
        <div className="flex flex-wrap gap-2">
          {topTags ? (
            topTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-gray-300 border-none font-normal"
              >
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-gray-500 italic text-xs">No tags</span>
          )}
        </div>
      </td>
      <td className="p-4 text-gray-400 hidden sm:table-cell">
        {company.problemCount}+
      </td>
      <td className="p-4 text-right">
        <Link
          href={`/company/${company.slug}`}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          aria-label={`View details for ${company.name}`}
        >
          View Details
          <ArrowRight className="ml-2 h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
});
