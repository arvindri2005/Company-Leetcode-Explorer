/**
 * @fileoverview Defines the search section component for the landing page.
 *
 * This client-side component provides a prominent search bar that allows users
 * to quickly find companies. It manages the state for the search input, fetches
 * autocomplete suggestions as the user types, and handles the navigation logic
 * for both direct searches and suggestion clicks.
 */
"use client";

import { useRouter } from "next/navigation";

import CompanySearchBar from "@/features/companies/components/company-search-bar";

/**
 * Renders a search section with an interactive company search bar.
 *
 * This component uses the `CompanySearchBar` to provide company search functionality.
 * It handles the navigation logic when a user submits a search.
 *
 * @returns {JSX.Element} The rendered search section component.
 */
export default function SearchSection() {
  const router = useRouter();

  const handleSearch = (term: string) => {
    if (term.trim()) {
      router.push(`/companies?search=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <section className="py-20 px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl mb-4 text-gray-custom-200">
          Start Your Journey
        </h2>
        <p className="text-xl mb-8 text-gray-custom-400">
          Search for problems by name, topic, or difficulty level
        </p>
        <CompanySearchBar onSearch={handleSearch} />
      </div>
    </section>
  );
}
