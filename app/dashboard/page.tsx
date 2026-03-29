import { OverviewPanel } from "@/components/dashboard/overview-panel";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");

export default function DashboardPage() {
  return <OverviewPanel businessId={businessId} />;
}
