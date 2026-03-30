import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Mot de passe oublie"
      title="Recevez un lien pour reinitialiser votre acces"
      description="Entrez l'adresse email utilisee pour ZakBot. Nous vous enverrons un lien de reinitialisation."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
