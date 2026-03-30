"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, setPending] = useState(false);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const { isConfigured } = getSupabaseConfig();

  return (
    <div className="space-y-5">
      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
          Configurez Supabase avant de tester la mise a jour du mot de passe.
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          if (!isConfigured) {
            toast.error("Configuration Supabase manquante.");
            return;
          }

          setPending(true);

          const { error } = await supabase.auth.updateUser({
            password: values.password,
          });

          if (error) {
            toast.error("Impossible de mettre a jour le mot de passe", {
              description: error.message,
            });
            setPending(false);
            return;
          }

          toast.success("Mot de passe mis a jour.");
          router.replace("/dashboard");
          router.refresh();
        })}
      >
        <FormField label="Nouveau mot de passe" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Au moins 6 caracteres"
            {...form.register("password")}
          />
        </FormField>

        <FormField
          label="Confirmer le nouveau mot de passe"
          error={form.formState.errors.confirmPassword?.message}
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmez le mot de passe"
            {...form.register("confirmPassword")}
          />
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer le nouveau mot de passe
        </Button>
      </form>

      <div className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary">
          Retour a la connexion
        </Link>
      </div>
    </div>
  );
}
