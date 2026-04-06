import { notFound } from "next/navigation";

import { RagSyncPanel } from "@/components/rag/rag-sync-panel";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessKnowledgePage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const { businessId } = await params;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return <RagSyncPanel businessId={parsedBusinessId} />;
}
