import { notFound } from "next/navigation";

import { BusinessProfileForm } from "@/components/forms/business-profile-form";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessProfilePage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const { businessId } = await params;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return <BusinessProfileForm businessId={parsedBusinessId} />;
}
