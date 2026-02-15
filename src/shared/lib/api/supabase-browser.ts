import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/env";

/**
 * Creates a Supabase client for browser/client-side usage.
 * Uses @supabase/ssr for proper cookie-based session management.
 */
export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
