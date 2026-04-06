import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { resolvePostLoginDestination } from "@/lib/business/server";
import { getServerTranslator } from "@/lib/i18n/server";
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
  const { t } = await getServerTranslator();
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(await resolvePostLoginDestination());
  }

  const params = await searchParams;

  return (
    <AuthShell
      eyebrow={t("auth.login.eyebrow")}
      title={t("auth.login.title")}
      description={t("auth.login.description")}
    >
      <LoginForm nextPath={params.next} message={params.message} />
    </AuthShell>
  );
}
