import { ProductsManager } from "@/components/products/products-manager";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");

export default function ProductsPage() {
  return <ProductsManager businessId={businessId} />;
}
