/**
 * @fileoverview Defines the hero section component for the landing page.
 *
 * This client-side component renders the main "above-the-fold" content for the
 * homepage. It includes the primary headline, a descriptive paragraph, a call-to-action
 * button, and a decorative background with floating shapes.
 */
"use client";

import { Rocket } from "lucide-react";
import { FloatingShapes } from "@/components/ui/floating-shapes";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * Renders the hero section of the landing page.
 *
 * This component is designed to be the first thing a user sees. It features a large,
 * attention-grabbing headline, a subtitle explaining the site's value proposition,
 * and a prominent "Start Exploring" button that navigates the user to the main
 * companies page. It also includes an animated `FloatingShapes` background for
 * visual appeal.
 *
 * @returns {JSX.Element} The rendered hero section.
 */
export default function HeroSection() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/companies");
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center text-center relative px-4 md:px-8"
    >
      <FloatingShapes />
      <div className="max-w-4xl z-[2]">
        <h1 className="text-4xl md:text-6xl mb-4 pb-4 bg-gradient-to-r from-brand-teal to-brand-purple bg-clip-text text-transparent animate-fadeInUp text-balance leading-tight">
          Master Your Coding Interviews
        </h1>
        <p className="text-2xl mb-8 text-gray-custom-400 animate-fadeInUp animation-delay-200 leading-relaxed max-w-2xl mx-auto">
          Explore thousands of real world interview problems with detailed
          solutions, explanations, and interview tips. Your journey to landing
          your dream job starts here.
        </p>
        <div className="flex gap-4 justify-center flex-wrap animate-fadeInUp animation-delay-400">
          <Button
            size="lg"
            className="h-auto py-4 px-8 rounded-full text-lg font-semibold bg-gradient-to-r from-brand-teal to-brand-purple border-none text-white hover:transform hover:-translate-y-1 hover:shadow-glow [&_svg]:size-5 transition-all duration-300"
            onClick={handleClick}
          >
            <Rocket />
            Start Exploring
          </Button>
          {/* <button className="px-8 py-4 bg-transparent text-gray-custom-200 border-2 border-gray-custom-700 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 no-underline inline-flex items-center gap-2 hover:border-brand-teal hover:text-brand-teal">
            <Play />
            Watch Demo
          </button> */}
        </div>
      </div>
    </section>
  );
}
