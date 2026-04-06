import { redirect } from "next/navigation";

import { resolveDashboardRedirect } from "@/lib/business/server";

export default async function ProductsPage() {
  redirect(await resolveDashboardRedirect("/products"));
}
