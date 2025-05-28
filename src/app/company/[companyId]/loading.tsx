
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Link as LinkIcon } from 'lucide-react';

export default function CompanyLoadingPage() {
  return (
    <section className="space-y-8">
      <div>
        <Skeleton className="h-9 w-36 mb-6" /> {/* Back button */}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
          <Skeleton className="h-[60px] w-[60px] rounded-lg border p-1" /> {/* Logo */}
          <div>
            <Skeleton className="h-10 w-48 md:w-72 mb-2" /> {/* Company Name */}
            <Skeleton className="h-5 w-64 md:w-96 mb-1.5" /> {/* Description */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" /> {/* Link Icon */}
              <Skeleton className="h-4 w-28" /> {/* Website Link Text */}
            </div>
          </div>
        </div>
      </div>
      
      <Skeleton className="h-px w-full my-8" /> {/* Separator */}

      {/* Statistics Skeleton */}
      <div className="my-8 p-6 bg-card rounded-lg shadow-md">
        <Skeleton className="h-7 w-40 md:w-52 mb-2" /> {/* Stats Title */}
        <Skeleton className="h-4 w-56 md:w-80 mb-6" /> {/* Stats Description */}
        
        <div className="space-y-10"> {/* Increased space for charts */}
          <div>
            <Skeleton className="h-6 w-52 md:w-64 mb-3" /> {/* Difficulty Breakdown Title */}
            <div className="flex justify-center">
              <Skeleton className="h-[200px] w-[200px] rounded-full" /> {/* Pie Chart Placeholder */}
            </div>
          </div>
           <div>
            <Skeleton className="h-6 w-60 md:w-72 mb-3" /> {/* Last Asked Period Title */}
            <div className="flex justify-center">
              <Skeleton className="h-[200px] w-[200px] rounded-full" /> {/* Pie Chart Placeholder */}
            </div>
          </div>
          <div>
            <Skeleton className="h-6 w-48 md:w-56 mb-3" /> {/* Common Tags Title */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>


      {/* ProblemList Controls Skeleton */}
      <div className="mb-6 p-4 bg-card rounded-lg shadow">
        <Skeleton className="h-10 w-full mb-4" /> {/* Search input */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div>
              <Skeleton className="h-5 w-36 md:w-40 mb-1.5" /> {/* Filter Label */}
              <Skeleton className="h-10 w-[150px] sm:w-[180px]" /> {/* Select Trigger */}
            </div>
            <div>
              <Skeleton className="h-5 w-40 md:w-44 mb-1.5" /> {/* Filter Label */}
              <Skeleton className="h-10 w-[170px] sm:w-[200px]" /> {/* Select Trigger */}
            </div>
            <div>
              <Skeleton className="h-5 w-20 md:w-24 mb-1.5" /> {/* Sort Label */}
              <Skeleton className="h-10 w-[150px] sm:w-[180px]" /> {/* Select Trigger */}
            </div>
          </div>
          <Skeleton className="h-5 w-28 md:w-32" /> {/* Problem count */}
        </div>
      </div>

      {/* Problem Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col h-full">
            <div className="p-6">
              <div className="flex justify-between items-start gap-2">
                <Skeleton className="h-6 w-3/4 mb-2" /> {/* Problem Title */}
                <Skeleton className="h-6 w-16" /> {/* Difficulty Badge */}
              </div>
            </div>
            <div className="p-6 pt-0 flex-grow">
              <Skeleton className="h-4 w-20 mb-1.5" /> {/* Tags Label */}
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-px w-full my-3" /> {/* Separator */}
              <Skeleton className="h-4 w-28 mb-1" /> {/* Last Asked Label */}
              <Skeleton className="h-4 w-36" /> {/* Last Asked Value */}
            </div>
            <div className="items-center p-6 pt-0 grid grid-cols-1 gap-2"> {/* Updated for two buttons */}
              <Skeleton className="h-10 w-full" /> 
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" /> {/* For Mock Interview button */}
            </div>
          </div>
        ))}
      </div>

      {/* AIGroupingSection Skeleton placeholder */}
      <Skeleton className="h-px w-full my-12" />
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-60 md:w-72 mx-auto mb-2" />
        <Skeleton className="h-5 w-72 md:w-80 mx-auto" />
      </div>
      <div className="flex justify-center mb-8">
        <Skeleton className="h-12 w-48 md:w-52" />
      </div>

      {/* FlashcardGenerator Skeleton placeholder */}
      <Skeleton className="h-px w-full my-12" />
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-64 md:w-80 mx-auto mb-2" /> {/* Title */}
        <Skeleton className="h-5 w-72 md:w-96 mx-auto" /> {/* Description */}
      </div>
      <div className="flex justify-center mb-8">
        <Skeleton className="h-12 w-52 md:w-60" /> {/* Button */}
      </div>

      {/* CompanyStrategyGenerator Skeleton placeholder */}
      <Skeleton className="h-px w-full my-12" />
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-72 md:w-96 mx-auto mb-2" /> {/* Title */}
        <Skeleton className="h-5 w-80 md:w-[500px] mx-auto" /> {/* Description */}
      </div>
      <div className="flex justify-center mb-8">
        <Skeleton className="h-12 w-56 md:w-64" /> {/* Button */}
      </div>

    </section>
  );
}
