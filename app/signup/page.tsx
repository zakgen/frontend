import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type SearchParams = Promise<{
  next?: string;
}>;

export default async function SignupPage({
  searchParams,
}: Readonly<{
  searchParams: SearchParams;
}>) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Creation de compte"
      title="Creez l'acces prive de votre boutique"
      description="Commencez avec une connexion simple par email pour reserver le cockpit Rasil a votre equipe."
    >
      <SignupForm nextPath={params.next} />
    </AuthShell>
  );
}
