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
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";

export function LoginForm({
  nextPath,
  message,
}: Readonly<{
  nextPath?: string;
  message?: string;
}>) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, setPending] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { isConfigured } = getSupabaseConfig();
  const redirectPath = getSafeRedirectPath(nextPath);

  return (
    <div className="space-y-5">
      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
          Ajoutez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans
          `.env.local` pour activer la connexion.
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm text-primary">
          {message}
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

          const { error } = await supabase.auth.signInWithPassword(values);

          if (error) {
            toast.error("Connexion impossible", {
              description: error.message,
            });
            setPending(false);
            return;
          }

          toast.success("Connexion reussie.");
          router.replace(redirectPath);
          router.refresh();
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

        <FormField label="Mot de passe" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            {...form.register("password")}
          />
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Se connecter
        </Button>
      </form>

      <div className="flex items-center justify-between gap-4 text-sm">
        <Link href="/forgot-password" className="text-primary transition hover:opacity-80">
          Mot de passe oublie ?
        </Link>
        <Link href={`/signup?next=${encodeURIComponent(redirectPath)}`} className="text-muted-foreground transition hover:text-foreground">
          Creer un compte
        </Link>
      </div>
    </div>
  );
}
