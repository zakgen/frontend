import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function ForgotPasswordPage() {
  const { t } = await getServerTranslator();

  return (
    <AuthShell
      eyebrow={t("auth.forgot.eyebrow")}
      title={t("auth.forgot.title")}
      description={t("auth.forgot.description")}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
