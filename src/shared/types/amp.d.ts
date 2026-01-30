/**
 * @file amp.d.ts
 * @description This declaration file provides TypeScript type definitions for AMP components used in JSX,
 * allowing them to be used with proper type checking in a React/Next.js project.
 */

// Define AMP component types for TypeScript
declare namespace JSX {
  interface IntrinsicElements {
    "amp-ad": React.detailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        type: string;
        width: string;
        height: string;
        "data-ad-client": string;
        "data-ad-slot": string;
        "data-auto-format": string;
        "data-full-width": string;
      },
      HTMLElement
    >;
    "amp-auto-ads": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        type: string;
        "data-ad-client": string;
      },
      HTMLElement
    >;
  }
}

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}






