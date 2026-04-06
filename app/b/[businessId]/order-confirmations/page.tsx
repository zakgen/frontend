import { notFound } from "next/navigation";

import { OrderConfirmationsPanel } from "@/components/order-confirmations/order-confirmations-panel";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessOrderConfirmationsPage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const { businessId } = await params;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return <OrderConfirmationsPanel businessId={parsedBusinessId} />;
}
