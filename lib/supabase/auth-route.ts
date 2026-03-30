import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getSafeRedirectPath, getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function handleSupabaseAuthRedirect(request: Request) {
  const { isConfigured } = getSupabaseConfig();
  const requestUrl = new URL(request.url);
  const errorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard");

  if (!isConfigured) {
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(
          "La configuration Supabase est incomplete.",
        )}&next=${encodeURIComponent(next)}`,
        requestUrl.origin,
      ),
    );
  }

  if (errorCode || errorDescription) {
    const message =
      errorCode === "otp_expired"
        ? "Le lien email a expire. Demandez un nouveau lien de confirmation."
        : "Le lien de confirmation est invalide ou a expire.";

    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`,
        requestUrl.origin,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const redirectTarget = type === "recovery" ? "/reset-password" : next;
      return NextResponse.redirect(new URL(redirectTarget, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      `/login?message=${encodeURIComponent(
        "Le lien de confirmation est invalide ou a expire.",
      )}&next=${encodeURIComponent(next)}`,
      requestUrl.origin,
    ),
  );
}
