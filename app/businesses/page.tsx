import { BusinessesScreen } from "@/components/businesses/businesses-screen";
import { BusinessProvider } from "@/components/providers/business-provider";
import { getMyBusinessesForUser } from "@/lib/business/server";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const { user, account } = await getMyBusinessesForUser("/businesses");

  return (
    <BusinessProvider
      initialData={account}
      initialCurrentBusinessId={account.current_business_id}
    >
      <BusinessesScreen userEmail={user.email ?? null} />
    </BusinessProvider>
  );
}
