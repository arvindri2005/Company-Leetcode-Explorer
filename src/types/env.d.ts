declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The URL of the application.
     */
    NEXT_PUBLIC_APP_URL?: string;

    /**
     * The current Node.js environment.
     */
    NODE_ENV?: "development" | "production" | "test";

    /**
     * The log level for the application.
     */
    LOG_LEVEL?: "DEBUG" | "INFO" | "WARN" | "ERROR";

    // --- Firebase Configuration ---
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    NEXT_PUBLIC_FIREBASE_APP_ID?: string;
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;

    // --- API Keys ---
    GEMINI_API_KEY?: string;
    GOOGLE_API_KEY?: string;

    /**
     * Token for logo service (e.g. logo.dev).
     * @deprecated SECURITY RISK: This token is currently exposed to the client in next.config.ts.
     * Ensure this is a public key or use a proxy if it is a secret key.
     */
    LOGO_API?: string;

    // --- AdSense ---
    NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID?: string;
    NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID?: string;
  }
}
