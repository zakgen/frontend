"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validators/auth";

export function ForgotPasswordForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, setPending] = useState(false);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  const { isConfigured } = getSupabaseConfig();

  return (
    <div className="space-y-5">
      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
          Configurez Supabase avant de tester la reinitialisation de mot de passe.
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

          const redirectTo = `${window.location.origin}/auth/confirm?next=/reset-password`;
          const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            redirectTo,
          });

          if (error) {
            toast.error("Impossible d'envoyer le lien", {
              description: error.message,
            });
            setPending(false);
            return;
          }

          toast.success("Lien envoye", {
            description: "Verifiez votre boite email pour definir un nouveau mot de passe.",
          });
          form.reset();
          setPending(false);
        })}
      >
        <FormField label="Adresse email" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="vous@boutique.ma"
            {...form.register("email")}
          />
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Envoyer le lien
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
