import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "@/env";

/**
 * @function cn
 * @description A utility function to merge Tailwind CSS classes. It uses `clsx` to conditionally apply classes and `tailwind-merge` to resolve conflicting classes.
 * @param {...ClassValue[]} inputs - A list of class values to be merged.
 * @returns {string} The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @function slugify
 * @description Converts a string into a URL-friendly slug.
 * It converts the string to lowercase, trims whitespace, replaces spaces with hyphens, and removes non-alphanumeric characters except for hyphens.
 * @param {string} text - The string to be converted.
 * @returns {string} The slugified string.
 */
export function slugify(text: string): string {
  if (typeof text !== "string") {
    return "";
  }
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars (alphanumeric, underscore, hyphen)
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * @function getLogoUrl
 * @description Appends a token query parameter to the logo URL if the LOGO_API environment variable is set.
 * @param {string | undefined} url - The original logo URL.
 * @returns {string | undefined} The URL with the token appended, or the original URL.
 * @returns {string | undefined} The URL with the token appended, or the original URL.
 */
export function getLogoUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (!env.LOGO_API) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${env.LOGO_API}`;
}

/**
 * @function capitalizeWords
 * @description Capitalizes the first letter of each word in a string.
 * @param {string} str - The string to be capitalized.
 * @returns {string} The capitalized string.
 */
export function capitalizeWords(str: string): string {
  if (!str) return str;
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * @function reloadPage
 * @description Reloads the current page.
 */
export function reloadPage() {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

/**
 * @function getDeterministicRandom
 * @description Generates a deterministic pseudo-random number between 0 and 1 based on a string seed.
 * Useful for consistent UI generation (e.g. random colors, dates) during SSR and client hydration.
 * @param {string} seed - The seed string.
 * @returns {number} A number between 0 (inclusive) and 1 (exclusive).
 */
export function getDeterministicRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) / 2147483648; // Normalize to 0-1
}

/**
 * @function safeJsonLd
 * @description Safely stringifies data for use in JSON-LD script tags, preventing XSS by escaping HTML characters.
 * This is crucial because standard JSON.stringify does not escape '<' or '>', which allows attackers to close the script tag.
 * @param {any} data - The data to stringify.
 * @returns {string} The escaped JSON string.
 */
export function safeJsonLd(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
