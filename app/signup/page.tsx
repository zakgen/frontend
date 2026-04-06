import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { resolvePostLoginDestination } from "@/lib/business/server";
import { getServerTranslator } from "@/lib/i18n/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type SearchParams = Promise<{
  next?: string;
}>;

export default async function SignupPage({
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
      eyebrow={t("auth.signup.eyebrow")}
      title={t("auth.signup.title")}
      description={t("auth.signup.description")}
    >
      <SignupForm nextPath={params.next} />
    </AuthShell>
  );
}
