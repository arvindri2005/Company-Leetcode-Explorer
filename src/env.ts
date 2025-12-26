import { z } from "zod";

const serverSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  LOGO_API: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://bytetooffer.com"),
  NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

const clientEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const formatErrors = (errors: z.ZodFormattedError<Map<string, string>, string>) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value) return `${name}: ${value._errors.join(", ")}`;
      return null;
    })
    .filter(Boolean);

// Skip validation in test environment to avoid breaking CI/tests that don't mock everything
const isTest = process.env.NODE_ENV === "test";

let _clientEnv = clientSchema.safeParse(clientEnv);

if (!_clientEnv.success && !isTest) {
  console.error(
    "❌ Invalid client environment variables:\n",
    ...formatErrors(_clientEnv.error.format()),
  );
  throw new Error("Invalid client environment variables");
}

// In test mode, use partial/empty data if validation fails
const clientData = _clientEnv.success ? _clientEnv.data : (clientEnv as unknown as z.infer<typeof clientSchema>);


let _serverEnv: ReturnType<typeof serverSchema.safeParse> = { success: true, data: {} as z.infer<typeof serverSchema> };

if (typeof window === "undefined") {
   const serverEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      LOGO_API: process.env.LOGO_API,
      NODE_ENV: process.env.NODE_ENV,
   };
   _serverEnv = serverSchema.safeParse(serverEnv);

    if (!_serverEnv.success && !isTest) {
      console.error(
        "❌ Invalid server environment variables:\n",
        ...formatErrors(_serverEnv.error.format()),
      );
      throw new Error("Invalid server environment variables");
    }
}

const serverData = _serverEnv.success ? _serverEnv.data : ({} as z.infer<typeof serverSchema>);

export const env = { ...clientData, ...serverData };
