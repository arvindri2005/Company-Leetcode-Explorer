/**
 * @fileoverview Defines a completely redesigned, modern header component for displaying company information.
 *
 * This component renders a visually striking header section for a company,
 * featuring its logo, name, website, and a brief description. It's designed
 * with a modern aesthetic to create a strong visual anchor for the page.
 */
import type { Company } from "@/types";
import { Building2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getLogoUrl } from "@/lib/utils";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Props for the CompanyHeader component.
 */
interface CompanyHeaderProps {
    company: Company;
}

/**
 * Renders a visually striking and modern header for a specific company.
 *
 * This component features a clean, spacious design with a prominent logo,
 * bold typography, and subtle animations. It aims to create a professional
 * and engaging introduction to the company's page.
 *
 * @param {CompanyHeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered company header section.
 */
export default function CompanyHeader({ company }: CompanyHeaderProps) {
    return (
        <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 border border-white/10 rounded-xl p-4 md:p-8 mb-4 md:mb-8 overflow-hidden shadow-lg transition-all duration-300 ease-in-out">
            <div className="relative z-20 mb-4 md:mb-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-gray-600" />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/companies" className="text-gray-400 hover:text-white transition-colors">Companies</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-gray-600" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-white font-medium capitalize">{company.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="relative z-10 flex flex-row md:flex-row items-center gap-3 md:gap-8 transition-all duration-300 ease-in-out">
                <div className="relative h-16 w-16 md:h-24 md:w-24 flex-shrink-0 border-2 md:border-4 border-white/10 rounded-full shadow transition-all duration-300 ease-in-out">
                    {company.logo ? (
                        <Image
                            src={getLogoUrl(company.logo) as string}
                            alt={`${company.name} Logo`}
                            fill
                            sizes="(max-width: 768px) 64px, 96px"
                            className="rounded-full object-contain bg-white p-2"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-700 rounded-full">
                            <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="text-left transition-all duration-300 ease-in-out w-full flex flex-col justify-center">
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight transition-all duration-300 ease-in-out break-words capitalize">
                        {company.name}
                    </h1>
                    {company.website && (
                        <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center text-xs md:text-sm text-sky-400 hover:text-sky-300 transition-colors mt-1"
                        >
                            {company.website}
                            <ExternalLink className="h-4 w-4 ml-1.5" />
                        </a>
                    )}
                    {company.description && (
                        <p className="hidden md:block mt-4 text-gray-300 max-w-2xl text-sm md:text-base transition-all duration-300 ease-in-out mx-auto md:mx-0">
                            {company.description}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
