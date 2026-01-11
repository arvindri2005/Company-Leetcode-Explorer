// src/components/sections/home-features-grid.tsx
"use client"; // Keep as client component if FeatureCard or any child needs client-side interactivity

import {
  BarChart3,
  BookOpenCheck,
  Bot,
  Brain,
  CheckSquare,
  FileSpreadsheet,
  Palette,
  PlusSquare,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { ActionFeatureCard } from "@/components/ui/action-feature-card";

/**
 * @function HomeFeaturesGrid
 * @description A section component that displays a grid of features for the homepage.
 * @returns {JSX.Element} The rendered grid of feature cards.
 */
export const HomeFeaturesGrid = () => {
  return (
    <section className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">
        Discover Our Powerful Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ActionFeatureCard
          icon={Search}
          title="Company Problem Explorer"
          description="Browse LeetCode-style problems frequently asked by specific companies. Filter by difficulty, tags, and recency."
          link="/companies"
          linkText="Find Company Problems"
        />
        <ActionFeatureCard
          icon={Bot}
          title="AI Mock Interviews"
          description="Practice coding problems with an AI interviewer that provides guidance and detailed feedback on your approach."
          link="/companies" // User will pick a problem from a company to start
          linkText="Start a Mock Interview"
        />
        <ActionFeatureCard
          icon={Sparkles}
          title="AI Similar Problems"
          description="Stuck on a problem? Get AI suggestions for conceptually similar LeetCode problems to reinforce your understanding."
          link="/companies" // User will pick a problem first
          linkText="Find Similar Problems"
        />
        <ActionFeatureCard
          icon={Brain}
          title="AI Problem Insights"
          description="Get AI-generated key concepts, common data structures, algorithms, and high-level hints for any LeetCode problem."
          link="/companies" // User will pick a problem first
          linkText="Get Problem Insights"
        />
        <ActionFeatureCard
          icon={BookOpenCheck}
          title="AI Generated Flashcards"
          description="Create study flashcards for key concepts and LeetCode problem patterns related to specific companies."
          link="/companies" // User will pick a company first
          linkText="Generate Flashcards"
        />
        <ActionFeatureCard
          icon={BarChart3}
          title="AI Prep Strategies"
          description="Receive personalized interview preparation strategies for LeetCode-style interviews tailored to specific companies and your target role."
          link="/companies" // User will pick a company first
          linkText="Get Prep Strategy"
        />
        <ActionFeatureCard
          icon={CheckSquare}
          title="Personalized Tracking"
          description="Log in to bookmark LeetCode problems and track your progress as 'Solved', 'Attempted', or 'To-Do'."
          link="/profile"
          linkText="View Your Profile"
        />
        <ActionFeatureCard
          icon={FileSpreadsheet}
          title="Bulk Data Management"
          description="Efficiently add multiple LeetCode problems or companies at once using Excel (.xlsx) or CSV (.csv) file uploads."
          link="/bulk-add-problems" // Or link to a page with both options
          linkText="Bulk Upload Data"
        />
        <ActionFeatureCard
          icon={PlusSquare}
          title="Contribute & Grow"
          description="Help expand our database by submitting new LeetCode problems and adding company information."
          link="/submit-problem"
          linkText="Add a Problem/Company"
        />
        <ActionFeatureCard
          icon={Palette}
          title="Customizable Theme"
          description="Switch between light, dark, or system default themes for your preferred viewing experience."
          link="#" // No specific link, just info
          linkText="Toggle in Header"
        />
        <ActionFeatureCard
          icon={Users}
          title="AI Question Grouping"
          description="Let AI categorize a company's LeetCode problems into related themes and concepts for structured learning."
          link="/companies" // Feature is on company page
          linkText="Group Company Questions"
        />
      </div>
    </section>
  );
};






