
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase } from 'lucide-react';
import type { Company } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  company: Company;
}

const CompanyCardComponent: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <Card className={cn(
      "group relative flex flex-col h-full transition-all duration-300 ease-out overflow-hidden rounded-xl",
      "bg-white/5 backdrop-blur-lg", // Glassmorphism effect
      "border border-white/10",
      "shadow-lg shadow-black/10",
      "hover:border-white/20 hover:shadow-xl hover:-translate-y-1"
    )}>
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-3">
          {company.logo && (
            <div className="flex-shrink-0 relative w-10 h-10 sm:w-12 sm:h-12">
              <Image
                src={company.logo}
                alt={`${company.name} logo`}
                fill
                className="rounded-full border-2 border-white/20 object-contain"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {company.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Briefcase className="h-3 w-3" />
                <span className="truncate">{company.problemCount} problem{company.problemCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex-grow" /> {/* Spacer */}

        <Button asChild className={cn(
          "w-full mt-4 py-2 px-4 h-auto",
          "bg-white/10 border border-white/20 text-white/80 rounded-full",
          "hover:bg-white/20 hover:text-white transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
        )}>
          <Link href={`/company/${company.slug}`}>
            View Problems
            <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const CompanyCard = React.memo(CompanyCardComponent);
export default CompanyCard;
