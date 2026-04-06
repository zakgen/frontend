import { notFound } from "next/navigation";

import { IntegrationsPanel } from "@/components/integrations/integrations-panel";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessIntegrationsPage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const { businessId } = await params;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return <IntegrationsPanel businessId={parsedBusinessId} />;
}
