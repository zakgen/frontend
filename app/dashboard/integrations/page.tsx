import { IntegrationsPanel } from "@/components/integrations/integrations-panel";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");

export default function IntegrationsPage() {
  return <IntegrationsPanel businessId={businessId} />;
}
