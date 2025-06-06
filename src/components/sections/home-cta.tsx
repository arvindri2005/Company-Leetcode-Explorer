
// src/components/sections/home-cta.tsx
'use client'; 

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const HomeCta = () => {
  return (
    <section className="text-center py-12 mt-10">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to Ace Your LeetCode Interviews?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Start exploring, practicing, and tracking your progress today.
        </p>
        <Button asChild size="lg" variant="default" className="group text-lg px-8 py-6 shadow-md hover:shadow-lg transition-shadow">
            <Link href="/signup">
            Sign Up for Free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </Button>
      </div>
    </section>
  );
};
