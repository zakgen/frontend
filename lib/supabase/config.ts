const FALLBACK_SUPABASE_URL = "https://placeholder.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "placeholder-anon-key-for-builds-without-supabase-config";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url: url ?? FALLBACK_SUPABASE_URL,
    anonKey: anonKey ?? FALLBACK_SUPABASE_ANON_KEY,
    isConfigured: Boolean(url && anonKey),
  };
}

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;

  return value;
}
