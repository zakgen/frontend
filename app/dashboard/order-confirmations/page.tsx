import { redirect } from "next/navigation";

import { resolveDashboardRedirect } from "@/lib/business/server";

export default async function OrderConfirmationsPage() {
  redirect(await resolveDashboardRedirect("/order-confirmations"));
}
