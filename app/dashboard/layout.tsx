import { redirect } from "next/navigation";

import { resolveDashboardRedirect } from "@/lib/business/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children: _children,
}: Readonly<{ children: React.ReactNode }>) {
  _children;
  redirect(await resolveDashboardRedirect());
}
