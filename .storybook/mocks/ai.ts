// Mock for src/ai/genkit
export const ai = {
  defineFlow: (config: unknown, fn: unknown) => fn,
  defineSchema: (schema: unknown) => schema,
  generate: () => Promise.resolve({ text: "Mock AI response" }),
};

// Robust, recursive Proxy mock for Zod to handle infinite chaining
const recursiveProxy: unknown = new Proxy(() => recursiveProxy, {
  get: () => recursiveProxy,
  apply: () => recursiveProxy,
});

export const z = recursiveProxy;

export const genkit = () => ai;
export const googleAI = () => ({});
