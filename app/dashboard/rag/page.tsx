import { RagSyncPanel } from "@/components/rag/rag-sync-panel";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");

export default function RagPage() {
  return <RagSyncPanel businessId={businessId} />;
}
