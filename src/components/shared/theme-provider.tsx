/**
 * @fileoverview Provides a theme provider component for managing light/dark mode.
 *
 * This file exports a client-side component that wraps the `next-themes` library's
 * `ThemeProvider`. This allows for easy integration of theme switching functionality
 * throughout the application, handling the provider logic in a single, reusable component.
 */
"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * A wrapper around the `next-themes` ThemeProvider.
 *
 * This component sets up the context for theme management (e.g., light/dark mode)
 * across the application. It passes all its props to the underlying provider from
 * the `next-themes` library, making it a flexible and reusable wrapper.
 *
 * @param {ThemeProviderProps} props - The props for the component, which are identical
 * to the props for the `next-themes` ThemeProvider. This includes `children` and other
 * configuration options like `attribute`, `defaultTheme`, etc.
 * @returns {JSX.Element} The `NextThemesProvider` wrapping the child components.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
