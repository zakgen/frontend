import { notFound } from "next/navigation";

import { OrderConfirmationsPanel } from "@/components/order-confirmations/order-confirmations-panel";

type Params = Promise<{
  businessId: string;
}>;

type SearchParams = Promise<{
  sessionId?: string;
}>;

export default async function BusinessOrderConfirmationsPage({
  params,
  searchParams,
}: Readonly<{
  params: Params;
  searchParams: SearchParams;
}>) {
  const { businessId } = await params;
  const { sessionId } = await searchParams;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return (
    <OrderConfirmationsPanel
      businessId={parsedBusinessId}
      initialSessionId={sessionId}
    />
  );
}
