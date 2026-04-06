import { notFound } from "next/navigation";

import { ProductsManager } from "@/components/products/products-manager";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessProductsPage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const { businessId } = await params;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return <ProductsManager businessId={parsedBusinessId} />;
}
