import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/shared/lib/api/supabase-server";

/**
 * Auth callback route handler.
 * Handles:
 * - OAuth redirects (Google sign-in)
 * - Password reset token exchanges
 * - Email verification confirmations
 * - PKCE code exchange
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Handle password recovery — redirect to reset password page
      if (type === "recovery") {
        return NextResponse.redirect(
          new URL("/auth/action?mode=resetPassword", origin),
        );
      }

      // Handle email verification
      if (type === "signup" || type === "email_change") {
        return NextResponse.redirect(
          new URL(`/auth/action?mode=verifyEmail&status=success`, origin),
        );
      }

      // Default: redirect to the intended destination
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange fails or no code, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_error", origin),
  );
}
