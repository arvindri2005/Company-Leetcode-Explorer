
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Bot, Brain, CheckSquare, BarChart3, Search, Sparkles, BookOpenCheck, FileSpreadsheet, Palette, Users, PlusSquare } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Company LeetCode Explorer | Home',
  description: 'Showcase of features for the Company LeetCode Explorer - your AI-powered interview preparation hub.',
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, link, linkText }) => (
  <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-start gap-4 pb-4">
      <div className="p-3 rounded-md bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <CardTitle className="text-xl mb-1">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </div>
    </CardHeader>
    <CardContent className="flex-grow" />
    <CardFooter>
      <Button asChild className="w-full group">
        <Link href={link}>
          {linkText}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function ShowcasePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-xl shadow-inner">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-primary">
            Company LeetCode Explorer
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your AI-powered hub for targeted LeetCode interview preparation. Explore company-specific problems, practice with AI, and track your progress.
          </p>
          <Button asChild size="lg" className="group text-lg px-8 py-6 shadow-md hover:shadow-lg transition-shadow">
            <Link href="/companies">
              Explore Companies Now
              <Search className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">Discover Our Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={Search}
            title="Company Problem Explorer"
            description="Browse LeetCode problems frequently asked by specific companies. Filter by difficulty, tags, and recency."
            link="/companies"
            linkText="Find Company Problems"
          />
          <FeatureCard
            icon={Bot}
            title="AI Mock Interviews"
            description="Practice coding problems with an AI interviewer that provides guidance and detailed feedback on your approach."
            link="/companies" // User will pick a problem from a company to start
            linkText="Start a Mock Interview"
          />
          <FeatureCard
            icon={Sparkles}
            title="AI Similar Problems"
            description="Stuck on a problem? Get AI suggestions for conceptually similar problems to reinforce your understanding."
            link="/companies" // User will pick a problem first
            linkText="Find Similar Problems"
          />
          <FeatureCard
            icon={Brain}
            title="AI Problem Insights"
            description="Get AI-generated key concepts, common data structures, algorithms, and high-level hints for any problem."
            link="/companies" // User will pick a problem first
            linkText="Get Problem Insights"
          />
          <FeatureCard
            icon={BookOpenCheck}
            title="AI Generated Flashcards"
            description="Create study flashcards for key concepts and problem patterns related to specific companies."
            link="/companies" // User will pick a company first
            linkText="Generate Flashcards"
          />
          <FeatureCard
            icon={BarChart3}
            title="AI Prep Strategies"
            description="Receive personalized interview preparation strategies tailored to specific companies and your target role."
            link="/companies" // User will pick a company first
            linkText="Get Prep Strategy"
          />
          <FeatureCard
            icon={CheckSquare}
            title="Personalized Tracking"
            description="Log in to bookmark problems and track your progress as 'Solved', 'Attempted', or 'To-Do'."
            link="/profile"
            linkText="View Your Profile"
          />
          <FeatureCard
            icon={FileSpreadsheet}
            title="Bulk Data Management"
            description="Efficiently add multiple problems or companies at once using Excel (.xlsx) file uploads."
            link="/bulk-add-problems" // Or link to a page with both options
            linkText="Bulk Upload Data"
          />
           <FeatureCard
            icon={PlusSquare}
            title="Contribute & Grow"
            description="Help expand our database by submitting new LeetCode problems and adding company information."
            link="/submit-problem"
            linkText="Add a Problem/Company"
          />
          <FeatureCard
            icon={Palette}
            title="Customizable Theme"
            description="Switch between light, dark, or system default themes for your preferred viewing experience."
            link="#" // No specific link, just info
            linkText="Toggle in Header"
          />
          <FeatureCard
            icon={Users}
            title="AI Question Grouping"
            description="Let AI categorize problems by a company into related themes and concepts for structured learning."
            link="/companies" // Feature is on company page
            linkText="Group Company Questions"
          />
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="text-center py-12 mt-10">
         <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to Ace Your Interviews?</h2>
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
    </div>
  );
}
