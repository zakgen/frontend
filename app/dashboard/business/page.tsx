import { BusinessProfileForm } from "@/components/forms/business-profile-form";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");

export default function BusinessPage() {
  return <BusinessProfileForm businessId={businessId} />;
}
