import { redirect } from "next/navigation";

import { resolveDashboardRedirect } from "@/lib/business/server";

export default async function IntegrationsPage() {
  redirect(await resolveDashboardRedirect("/integrations"));
}
