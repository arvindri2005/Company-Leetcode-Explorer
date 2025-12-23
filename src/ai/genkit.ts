/**
 * @fileoverview Initializes and configures the Genkit AI instance.
 *
 * This module sets up a reusable Genkit instance with the Google AI plugin,
 * specifying the default model to be used across the application. This centralized
 * setup allows for consistent AI model usage and easy configuration management.
 */
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

/**
 * The configured Genkit AI instance.
 *
 * This instance is initialized with the Google AI plugin and defaults to using
 * the 'gemini-2.0-flash' model for all AI-powered operations. It serves as the
 * central point for interacting with the Genkit framework.
 *
 * @type {import('genkit').Genkit}
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: "googleai/gemini-flash-lite-latest",
});
