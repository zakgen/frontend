import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type SearchParams = Promise<{
  next?: string;
  message?: string;
}>;

export default async function LoginPage({
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
      eyebrow="Connexion"
      title="Connectez-vous a votre espace Rasil"
      description="Accedez a vos conversations, votre catalogue et vos flux operationnels depuis un espace prive."
    >
      <LoginForm nextPath={params.next} message={params.message} />
    </AuthShell>
  );
}
