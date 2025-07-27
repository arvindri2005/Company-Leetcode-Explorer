
import Footer from "@/components/landing/footer";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export const metadata: Metadata = {
    title: "Contact Us | Byte To Offer",
    description: "Contact Byte To Offer for support or inquiries.",
    robots: {
        index: false,
        follow: false,
    },
    alternates: {
        canonical: `${APP_URL}/contact`,
    },
};

export default function ContactPage() {
    return (
        <div className="bg-background w-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Contact Us</h1>
                <p className="mt-4 text-muted-foreground">
                    Have a question or want to give us feedback? Fill out the form below.
                </p>

                <form className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400">
                            Name
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                            Email
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-400">
                            Message
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-primary py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
}
