import { redirect } from "next/navigation";

import { resolveDashboardRedirect } from "@/lib/business/server";

export default async function DashboardPage() {
  redirect(await resolveDashboardRedirect());
}
