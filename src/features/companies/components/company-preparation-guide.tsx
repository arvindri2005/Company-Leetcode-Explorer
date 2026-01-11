import React from "react";

import { BookOpen, CheckCircle2,HelpCircle, Lightbulb } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { type Company } from "@/features/companies/types";
import { capitalizeWords } from "@/lib/utils";

interface CompanyPreparationGuideProps {
  company: Company;
}

export default function CompanyPreparationGuide({
  company,
}: CompanyPreparationGuideProps) {
  const companyName = capitalizeWords(company.name);

  return (
    <div className="space-y-8 mt-12">
      {/* About Section */}
      {company.description && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            About {companyName}
          </h2>
          <Card className="border-white/10">
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed">
                {company.description}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Interview Process Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          {companyName} Interview Process
        </h2>
        <Card className="border-white/10">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              The interview process at {companyName} typically follows a standard
              structure designed to assess your technical skills, problem-solving
              abilities, and cultural fit. While specific rounds may vary by role
              and level, here is what you can generally expect:
            </p>
            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2">1. Recruiter Screen</h3>
                <p className="text-sm text-muted-foreground">
                  A 30-minute call to discuss your background, interests, and the
                  role. Be prepared to talk about your resume and why you want to
                  join {companyName}.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2">2. Technical Screen</h3>
                <p className="text-sm text-muted-foreground">
                  One or two coding interviews (45-60 mins) focusing on data
                  structures and algorithms. Often conducted via video call with a
                  shared code editor.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2">3. Onsite Loop</h3>
                <p className="text-sm text-muted-foreground">
                  A series of 3-5 interviews covering coding, system design, and
                  behavioral questions. This is the final and most comprehensive
                  stage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Preparation Tips Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          How to Prepare for {companyName}
        </h2>
        <Card className="border-white/10">
          <CardContent className="pt-6">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-bold text-foreground min-w-[120px]">
                  Master the Basics:
                </span>
                Focus on core data structures (Arrays, Linked Lists, Trees, Graphs)
                and algorithms (Sorting, Searching, BFS/DFS, Dynamic Programming).
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-foreground min-w-[120px]">
                  Practice Problems:
                </span>
                Solve the most frequently asked questions for {companyName} listed
                above. Aim to understand the underlying patterns rather than just
                memorizing solutions.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-foreground min-w-[120px]">
                  System Design:
                </span>
                For senior roles, practice designing scalable systems. Understand
                concepts like load balancing, caching, database sharding, and API
                design.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-foreground min-w-[120px]">
                  Communication:
                </span>
                During interviews, think out loud. Explain your thought process,
                trade-offs, and edge cases before you start coding.
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          Frequently Asked Questions
        </h2>
        <Card className="border-white/10">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  What programming languages can I use?
                </AccordionTrigger>
                <AccordionContent>
                  Most companies, including {companyName}, allow you to use any
                  mainstream programming language you are comfortable with, such
                  as Python, Java, C++, or JavaScript. It&apos;s best to stick to the
                  language you know best.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  How hard are the interview questions?
                </AccordionTrigger>
                <AccordionContent>
                  Questions typically range from Medium to Hard difficulty on
                  platforms like LeetCode. It&apos;s important to be comfortable with
                  optimizing your solutions for time and space complexity.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  Does {companyName} ask behavioral questions?
                </AccordionTrigger>
                <AccordionContent>
                  Yes, behavioral questions are a key part of the interview. Be
                  prepared to discuss your past experiences, challenges you&apos;ve
                  faced, and how you work in a team. Using the STAR method
                  (Situation, Task, Action, Result) is highly recommended.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  How long does the process take?
                </AccordionTrigger>
                <AccordionContent>
                  The entire process from application to offer can take anywhere
                  from a few weeks to a couple of months, depending on the role
                  and the company&apos;s current hiring volume.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}






