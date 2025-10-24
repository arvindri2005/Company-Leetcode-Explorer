/**
 * @fileoverview Defines the layout for the contact page section.
 *
 * This file exports a simple layout component for the `/contact` route.
 * Its primary purpose is to provide specific metadata for the contact page.
 * Currently, it doesn't add any extra structural elements and just renders
 * its children directly.
 */
import type { Metadata } from "next";

/**
 * Metadata for the Contact page.
 *
 * This object provides SEO information, including the title and description,
 * which are specific to the contact page.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
    title: "Contact Us | Byte To Offer",
    description:
        "Have questions or feedback? Contact the Byte To Offer team. We are here to help you with your technical interview preparation needs.",
};

/**
 * A pass-through layout component for the contact page.
 *
 * This layout component simply renders the child components (in this case, the page)
 * that it contains. It exists to associate the specific `metadata` with the
 * `/contact` route and its sub-routes.
 *
 * @param {{ children: React.ReactNode }} props - The props for the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {React.ReactNode} The children of the layout.
 */
export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
