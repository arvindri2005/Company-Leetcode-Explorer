// app/contact/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us | Byte To Offer",
    description:
        "Have questions or feedback? Contact the Byte To Offer team. We are here to help you with your technical interview preparation needs.",
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
