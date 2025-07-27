
import Footer from "@/components/landing/footer";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export const metadata: Metadata = {
    title: "Blog | Byte To Offer",
    description: "Read the latest articles from the Byte To Offer team.",
    alternates: {
        canonical: `${APP_URL}/blog`,
    },
};

const blogPosts = [
    {
        title: "Mastering the Coding Interview: A Step-by-Step Guide",
        date: "July 20, 2024",
        excerpt: "In this post, we break down the essential steps to ace your next technical interview, from preparation to execution.",
        slug: "mastering-the-coding-interview",
    },
    {
        title: "Top 10 Data Structures You Need to Know",
        date: "July 15, 2024",
        excerpt: "A deep dive into the most common data structures that appear in coding interviews and how to master them.",
        slug: "top-10-data-structures",
    },
    {
        title: "How to Use AI to Supercharge Your Interview Prep",
        date: "July 10, 2024",
        excerpt: "Learn how to leverage AI tools like Byte To Offer to get a competitive edge in your interview preparation.",
        slug: "ai-interview-prep",
    },
];

export default function BlogPage() {
    return (
        <div className="bg-background w-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Blog</h1>
                <p className="mt-4 text-muted-foreground">
                    Insights and articles from the Byte To Offer team.
                </p>

                <div className="mt-12 space-y-12">
                    {blogPosts.map((post) => (
                        <div key={post.slug}>
                            <h2 className="text-2xl font-bold">
                                <a 
                                // href={`/blog/${post.slug}`} 
                                className="hover:underline">
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
