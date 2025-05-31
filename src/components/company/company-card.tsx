
'use client';

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Company } from '@/types';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard = ({ company }: CompanyCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
      <CardHeader className="flex flex-col xs:flex-row items-start gap-3 p-3 sm:p-4 lg:p-5">
        {company.logo && (
          <div className="flex-shrink-0">
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              width={32}
              height={32}
              className="rounded-md border xs:w-8 xs:h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
              data-ai-hint={`${company.name} logo`}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 w-full">
          <CardTitle className="text-base sm:text-lg lg:text-xl truncate pr-2">
            {company.name}
          </CardTitle>
          {company.description && (
            <CardDescription className="mt-1 text-xs sm:text-sm line-clamp-2 lg:line-clamp-3 leading-relaxed">
              {company.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0" />
      
      <CardFooter className="flex flex-col gap-2 p-3 sm:p-4 lg:p-5 pt-2">
        <div className="flex flex-col xs:flex-row gap-2 w-full">
          {company.website && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full xs:flex-1 group/btn text-xs sm:text-sm"
            >
              <Link href={company.website} target="_blank" rel="noopener noreferrer">
                <span className="truncate">Website</span>
                <ExternalLink className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover/btn:scale-105 transition-transform flex-shrink-0" />
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant="default"
            size="sm"
            className={`w-full group/btn text-xs sm:text-sm ${
              company.website ? 'xs:flex-1' : 'xs:w-full'
            }`}
          >
            <Link href={`/company/${company.slug}`}>
              <span className="truncate">View Problems</span>
              <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover/btn:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CompanyCard;
