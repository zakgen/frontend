import { notFound } from "next/navigation";

import { OverviewPanel } from "@/components/dashboard/overview-panel";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessOverviewPage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const { businessId } = await params;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return <OverviewPanel businessId={parsedBusinessId} />;
}
