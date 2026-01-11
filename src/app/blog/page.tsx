/**
 * @fileoverview Defines the main blog listing page for the application.
 *
 * This file contains the Next.js page component for the `/blog` route. It
 * displays a list of blog post summaries. Currently, the posts are hardcoded
 * as a placeholder. It also includes metadata for SEO purposes.
 */
import type { Metadata } from "next";

import { env } from "@/env";
import Footer from "@/features/landing/components/footer";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

/**
 * Metadata for the Blog page.
 *
 * Provides SEO information like the title, description, and canonical URL
 * for the main blog listing page.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Tech Interview Insights Blog | Byte To Offer",
  description:
    "Explore articles on acing coding interviews, data structures, algorithms, and AI-powered interview prep. Stay ahead with Byte To Offer's expert insights.",
  alternates: {
    canonical: `${APP_URL}/blog`,
  },
};

/**
 * A hardcoded array of blog post data.
 *
 * @description This is a placeholder for a dynamic content management system (CMS)
 * or a database. Each object represents a blog post with its title, date, excerpt, and slug.
 */
const blogPosts = [
  {
    title: "Mastering the Coding Interview: A Step-by-Step Guide",
    date: "July 20, 2024",
    excerpt:
      "In this post, we break down the essential steps to ace your next technical interview, from preparation to execution.",
    slug: "mastering-the-coding-interview",
  },
  {
    title: "Top 10 Data Structures You Need to Know",
    date: "July 15, 2024",
    excerpt:
      "A deep dive into the most common data structures that appear in coding interviews and how to master them.",
    slug: "top-10-data-structures",
  },
  {
    title: "How to Use AI to Supercharge Your Interview Prep",
    date: "July 10, 2024",
    excerpt:
      "Learn how to leverage AI tools like Byte To Offer to get a competitive edge in your interview preparation.",
    slug: "ai-interview-prep",
  },
];

/**
 * Renders the main blog page, listing all available blog posts.
 *
 * This component displays a title and a list of post summaries based on the
 * `blogPosts` array. Each summary includes the title, date, an excerpt, and a
 * "Read more" link (currently non-functional).
 *
 * @returns {JSX.Element} The rendered blog listing page.
 */
export default function BlogPage() {
  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
          Blog
        </h1>
        <p className="mt-4 text-muted-foreground">
          Insights and articles from the Byte To Offer team.
        </p>

        <div className="mt-12 space-y-12">
          {blogPosts.map((post) => (
            <div key={post.slug}>
              <h2 className="text-2xl font-bold text-balance">
                <a
                  // href={`/blog/${post.slug}`}
                  className="hover:underline"
                >
                  {post.title}
                </a>
              </h2>
              <p className="mt-2 text-muted-foreground">{post.date}</p>
              <p className="mt-4">{post.excerpt}</p>
              <a
                // href={`/blog/${post.slug}`}
                className="mt-4 inline-block text-primary hover:underline"
              >
                Read more &rarr;
              </a>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}






