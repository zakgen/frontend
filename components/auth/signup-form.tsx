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
import { getSafeRedirectPath, getSupabaseConfig } from "@/lib/supabase/config";
import { signupSchema, type SignupFormValues } from "@/lib/validators/auth";

export function SignupForm({
  nextPath,
}: Readonly<{
  nextPath?: string;
}>) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, setPending] = useState(false);
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      storeName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { isConfigured } = getSupabaseConfig();
  const redirectPath = getSafeRedirectPath(nextPath);

  return (
    <div className="space-y-5">
      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
          La creation de compte necessite vos variables Supabase dans `.env.local`.
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

          const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
            redirectPath,
          )}`;

          const { error, data } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              emailRedirectTo: redirectTo,
              data: {
                store_name: values.storeName,
              },
            },
          });

          if (error) {
            toast.error("Creation du compte impossible", {
              description: error.message,
            });
            setPending(false);
            return;
          }

          if (data.session) {
            toast.success("Compte cree.");
            router.replace(redirectPath);
            router.refresh();
            return;
          }

          toast.success("Confirmez votre email", {
            description: "Un lien de validation vient d'etre envoye.",
          });
          router.replace(
            `/login?message=${encodeURIComponent(
              "Verifiez votre boite email pour confirmer votre compte.",
            )}&next=${encodeURIComponent(redirectPath)}`,
          );
          router.refresh();
        })}
      >
        <FormField label="Nom de la boutique" error={form.formState.errors.storeName?.message}>
          <Input
            autoComplete="organization"
            placeholder="Maison Yasmine"
            {...form.register("storeName")}
          />
        </FormField>

        <FormField label="Adresse email" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="vous@boutique.ma"
            {...form.register("email")}
          />
        </FormField>

        <FormField label="Mot de passe" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Au moins 6 caracteres"
            {...form.register("password")}
          />
        </FormField>

        <FormField
          label="Confirmer le mot de passe"
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
          Creer mon acces
        </Button>
      </form>

      <div className="text-sm text-muted-foreground">
        Deja un compte ?{" "}
        <Link href={`/login?next=${encodeURIComponent(redirectPath)}`} className="text-primary">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
