import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, FileText, Bot, Monitor, Activity, Keyboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Tools | Byte to Offer",
  description: "Essential tools for software engineers: Code Playground, Resume Analyzer, Interview Simulator, and more.",
};

const tools = [
  {
    title: "Code Playground",
    description: "Write, run, and debug code in multiple languages directly in your browser. Perfect for testing snippets and solving algorithmic problems.",
    icon: Code2,
    href: "/playground",
    cta: "Start Coding",
    status: "Available"
  },
  {
    title: "Resume Analyzer",
    description: "Get instant AI-driven feedback on your resume. Optimize it for ATS scanners and recruiter reviews to increase your interview calls.",
    icon: FileText,
    href: "#",
    cta: "Analyze Resume",
    status: "Coming Soon"
  },
   {
    title: "Interview Simulator",
    description: "Practice mock interviews with our AI-powered interviewer. Get real-time feedback on your answers and communication style.",
    icon: Bot,
    href: "#",
    cta: "Start Interview",
    status: "Coming Soon"
  },
    {
    title: "System Design Board",
    description: "Collaborative whiteboard optimized for system design interviews. Comes with pre-built templates for common architecture patterns.",
    icon: Monitor,
    href: "#",
    cta: "Open Board",
    status: "Coming Soon"
  },
    {
    title: "Complexity Analyzer",
    description: "Instantly analyze the time and space complexity of your algorithms to ensure efficient solutions.",
    icon: Activity,
    href: "#",
    cta: "Analyze Code",
    status: "Coming Soon"
  },
  {
    title: "Speed Coder",
    description: "Test your typing speed and accuracy with real code snippets. Improve your muscle memory for syntax in various languages.",
    icon: Keyboard,
    href: "/tools/typing-test",
    cta: "Start Typing",
    status: "Available"
  }
];

export default function ToolsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Developer Tools
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Supercharge your technical interview preparation with our suite of powerful tools designed for software engineers.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.title} className="flex flex-col h-full hover:border-primary/50 hover:shadow-lg transition-all duration-300 group">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <tool.icon className="w-6 h-6" />
                 </div>
                 {tool.status === "Coming Soon" && (
                     <span className="text-xxs uppercase font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground tracking-wide">
                       Coming Soon
                     </span>
                 )}
              </div>
              <CardTitle className="text-2xl">{tool.title}</CardTitle>
              <CardDescription className="pt-3 text-base leading-relaxed">{tool.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
            </CardContent>
            <CardFooter>
                {tool.status === "Available" ? (
                    <Button asChild className="w-full text-base py-5 group/btn">
                        <Link href={tool.href}>
                            {tool.cta} 
                            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                ) : (
                    <Button disabled variant="secondary" className="w-full text-base py-5 opacity-50 cursor-not-allowed">
                        {tool.status}
                    </Button>
                )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
