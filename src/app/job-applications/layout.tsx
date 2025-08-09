// app/contact/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Job Application Tracker | Byte To Offer",
    description:
        "Track and manage your job applications seamlessly. Keep a log of companies you have applied to, interview dates, and application statuses to stay organized in your job hunt.",
};

export default function JobApplicationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
