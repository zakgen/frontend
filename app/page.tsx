import { redirect } from "next/navigation";

import { resolvePostLoginDestination } from "@/lib/business/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  redirect(user ? await resolvePostLoginDestination() : "/login");
}
