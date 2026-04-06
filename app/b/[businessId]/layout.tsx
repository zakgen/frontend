import { notFound, redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BusinessProvider } from "@/components/providers/business-provider";
import { findBusinessById, getMyBusinessesForUser } from "@/lib/business/server";

export const dynamic = "force-dynamic";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Params;
}>) {
  const resolvedParams = await params;
  const businessId = Number(resolvedParams.businessId);

  if (!Number.isFinite(businessId) || businessId <= 0) {
    notFound();
  }

  const { user, account } = await getMyBusinessesForUser(
    `/b/${resolvedParams.businessId}`,
  );

  if (account.businesses.length === 0) {
    redirect("/businesses");
  }

  const business = findBusinessById(account, businessId);

  if (!business) {
    redirect("/businesses");
  }

  return (
    <BusinessProvider initialData={account} initialCurrentBusinessId={business.id}>
      <DashboardShell businessId={business.id} userEmail={user.email ?? null}>
        {children}
      </DashboardShell>
    </BusinessProvider>
  );
}
