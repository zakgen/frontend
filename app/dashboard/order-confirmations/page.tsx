import { OrderConfirmationsPanel } from "@/components/order-confirmations/order-confirmations-panel";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");

export default function OrderConfirmationsPage() {
  return <OrderConfirmationsPanel businessId={businessId} />;
}
