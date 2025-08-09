
import Footer from "@/components/landing/footer";
import { useFormState, useFormStatus } from "react-dom";
import { sendContactMessage } from "@/app/contact/actions";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Metadata } from "next";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-md border border-transparent bg-primary py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
            {pending ? "Sending..." : "Send Message"}
        </button>
    );
}

export const metadata: Metadata = {
    title: 'Contact Us | Byte To Offer',
    description: 'Have questions or feedback? Contact the Byte To Offer team. We are here to help you with your technical interview preparation needs.',
};

export default function ContactPage() {
    const [state, formAction] = useFormState(sendContactMessage, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.message) {
            toast({
                title: "Success!",
                description: state.message,
            });
        }
    }, [state, toast]);

    return (
        <div className="bg-background w-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Contact Us</h1>
                <p className="mt-4 text-muted-foreground">
                    Have a question or want to give us feedback? Fill out the form below.
                </p>

                <form action={formAction} className="mt-8 space-y-6">
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
                        {state?.errors?.name && <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>}
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
                        {state?.errors?.email && <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>}
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
                        {state?.errors?.message && <p className="text-red-500 text-sm mt-1">{state.errors.message}</p>}
                    </div>
                    <div>
                        <SubmitButton />
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
}