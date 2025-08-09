import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Company } from "@/types";

interface CompanyCardProps {
    company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
    const [imgSrc, setImgSrc] = useState(company.logo);

    return (
        <article className="group relative flex flex-col h-full transition-all duration-300 ease-out overflow-hidden rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg shadow-black/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1">
            <header className="p-4 flex items-center gap-3">
                {company.logo && (
                    <Image
                        src={imgSrc}
                        alt={`${company.name} logo`}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-white/20 object-contain"
                        priority
                        onError={() => setImgSrc("/icon.png")}
                    />
                )}
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-white truncate">
                        {company.name}
                    </h2>
                    <p
                        className="flex items-center gap-1.5 text-xs text-white/60"
                        aria-label="Problem count"
                    >
                        <span
                            aria-hidden="true"
                            className="inline-block align-middle mr-1"
                        >
                            💼
                        </span>
                        <span className="truncate">
                            {company.problemCount} problem
                            {company.problemCount !== 1 ? "s" : ""}
                        </span>
                    </p>
                </div>
            </header>
            <div className="flex-grow" />
            <footer className="p-4 pt-0">
                <Link
                    href={`/company/${company.slug}`}
                    className="block w-full mt-4 py-2 px-4 h-auto bg-white/10 border border-white/20 text-white/80 rounded-full text-center hover:bg-white/20 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
                    aria-label={`View problems for ${company.name}`}
                >
                    View Problems
                    <span
                        aria-hidden="true"
                        className="ml-2"
                    >
                        →
                    </span>
                </Link>
            </footer>
        </article>
    );
};

export default React.memo(CompanyCard);
