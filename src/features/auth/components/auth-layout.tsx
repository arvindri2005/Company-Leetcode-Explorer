"use client";

import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export default function AuthLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] justify-center items-center py-12 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
      </div>

      <div
        className="w-full max-w-md border border-border/50 bg-card/60 backdrop-blur-xl rounded-3xl mb-8 shadow-2xl relative z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500 ease-out fill-mode-forwards"
      >
        <div className="p-6 md:p-8 space-y-2 text-center">
             <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-primary"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
        <div className="p-6 md:p-8 pt-0">{children}</div>
      </div>
    </section>
  );
}






