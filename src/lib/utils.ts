import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  if (!process.env.LOGO_API) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${process.env.LOGO_API}`;
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
 * @function getErrorMessage
 * @description Extracts the error message from an unknown error object.
 * @param {unknown} error - The error object.
 * @param {string} [defaultMessage="An unknown error occurred"] - The default message to return if the error is not an instance of Error.
 * @returns {string} The error message.
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = "An unknown error occurred",
): string {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}
