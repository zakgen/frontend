import { handleSupabaseAuthRedirect } from "@/lib/supabase/auth-route";

export async function GET(request: Request) {
  return handleSupabaseAuthRedirect(request);
}
