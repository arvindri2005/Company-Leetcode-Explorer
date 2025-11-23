import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Company } from "@/types";
import { getLogoUrl } from "@/lib/utils";
import { Star } from "lucide-react";

interface CompanyTableProps {
  companies: Company[];
}

export function CompanyTable({ companies }: CompanyTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-[#1A1A1A]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400">
              <th className="p-4 font-medium">Company</th>
              <th className="p-4 font-medium">Top Tags</th>
              <th className="p-4 font-medium">Problems</th>
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
}

function CompanyRow({ company }: { company: Company }) {
  const imgSrc = getLogoUrl(company.logo) || "/icon.png";
  
  // Get top 2 tags
  const topTags = company.commonTags
    ?.sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map(t => t.tag)
    .join(", ") || "Tech";

  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-white rounded-lg p-1.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Image
              src={imgSrc}
              alt={`${company.name} logo`}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="font-medium text-white group-hover:text-teal-400 transition-colors">
            {company.name}
          </span>
        </div>
      </td>
      <td className="p-4 text-gray-400">
        {topTags}
      </td>
      <td className="p-4 text-gray-400">
        {company.problemCount}+
      </td>
      <td className="p-4 text-right">
        <Link
          href={`/company/${company.slug}`}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
        >
          View Details
        </Link>
      </td>
    </tr>
  );
}
