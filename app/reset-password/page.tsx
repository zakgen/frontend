import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function ResetPasswordPage() {
  const { t } = await getServerTranslator();

  return (
    <AuthShell
      eyebrow={t("auth.reset.eyebrow")}
      title={t("auth.reset.title")}
      description={t("auth.reset.description")}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
