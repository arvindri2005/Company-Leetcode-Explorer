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
