import type { Metadata } from "next";
import TypingTestContainer from "@/components/tools/typing-test/typing-test-container";

export const metadata: Metadata = {
  title: "Speed Coder - Typing Test for Developers | Byte to Offer",
  description: "Improve your coding speed and accuracy with our developer-focused typing test.",
};

export default function TypingTestPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-balance">
          Speed Coder
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Don&apos;t just type random words. Practice with real syntax, algorithms, and data structures.
        </p>
      </div>
      
      <TypingTestContainer />
    </div>
  );
}
