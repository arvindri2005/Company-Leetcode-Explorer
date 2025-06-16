'use client';

import React from 'react';
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

const CompanyCardComponent: React.FC<CompanyCardProps> = ({ company }) => {
  const problemCount = company.problemCount || 0;
  const cardTitle = `${company.name} LeetCode Problems`;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
      <CardHeader className="flex flex-col xs:flex-row items-start gap-3 p-3 sm:p-4 lg:p-5">
        {company.logo && (
          <div className="flex-shrink-0">
            <Image
              src={company.logo}
              alt={`${company.name} company logo`}
              width={32}
              height={32}
              className="rounded-md border xs:w-8 xs:h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
              priority={true}
            />
          </div>
        )}
        <div className="flex-grow min-w-0">
          <CardTitle className="text-lg font-bold leading-tight truncate">
            <Link href={`/company/${company.slug}`} className="hover:underline">
              <span className="sr-only">Practice </span>
              {cardTitle}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-1">
            {problemCount > 0 ? (
              <>Practice {problemCount} coding interview questions commonly asked at {company.name} interviews.</>
            ) : (
              <>Explore coding interview questions from {company.name}'s technical interviews.</>
            )}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-3 sm:p-4 lg:p-5">
        {company.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {company.description}
          </p>
        )}
        <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
          {problemCount > 0 && (
            <>
              <dt className="text-muted-foreground">Problem Count:</dt>
              <dd className="font-medium">{problemCount}</dd>
            </>
          )}
          {company.averageDifficulty && (
            <>
              <dt className="text-muted-foreground">Avg. Difficulty:</dt>
              <dd className="font-medium">{company.averageDifficulty}</dd>
            </>
          )}
        </dl>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 lg:p-5">
        <Button
          asChild
          className="w-full group-hover:translate-x-1 transition-transform"
          variant="default"
        >
          <Link href={`/company/${company.slug}`}>
            <span>Practice Problems</span>
            <ArrowRight className="ml-2 h-4 w-4" />
            <span className="sr-only">
              View all LeetCode problems for {company.name}
            </span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const CompanyCard = React.memo(CompanyCardComponent);
export default CompanyCard;
