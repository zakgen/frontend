import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Nouveau mot de passe"
      title="Choisissez un nouveau mot de passe"
      description="Cette etape finalise la recuperation de votre acces avant de revenir dans le dashboard."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
