declare namespace NodeJS {
  interface ProcessEnv {
    // Shared
    NODE_ENV: "development" | "test" | "production";
    LOG_LEVEL?: "DEBUG" | "INFO" | "WARN" | "ERROR";

    // Server
    GEMINI_API_KEY?: string;
    GOOGLE_API_KEY?: string;

    // Client (NEXT_PUBLIC_)
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID?: string;
    NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID?: string;
    NEXT_PUBLIC_FIREBASE_API_KEY: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    NEXT_PUBLIC_FIREBASE_APP_ID: string;
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;

    // Other
    LOGO_API?: string;
  }
}
