"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/forms/form-field";
import { useLocale } from "@/components/providers/locale-provider";
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
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
          {t("auth.supabaseMissingSignup")}
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          if (!isConfigured) {
            toast.error(t("auth.toast.configMissing"));
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
            toast.error(t("auth.toast.signupError"), {
              description: error.message,
            });
            setPending(false);
            return;
          }

          if (data.session) {
            toast.success(t("auth.toast.signupSuccess"));
            router.replace(redirectPath);
            router.refresh();
            return;
          }

          toast.success(t("auth.toast.confirmEmail"), {
            description: t("auth.toast.confirmEmailDescription"),
          });
          router.replace(
            `/login?message=${encodeURIComponent(
              "Verifiez votre boite email pour confirmer votre compte.",
            )}&next=${encodeURIComponent(redirectPath)}`,
          );
          router.refresh();
        })}
      >
        <FormField label={t("auth.storeName")} error={form.formState.errors.storeName?.message}>
          <Input
            autoComplete="organization"
            placeholder={t("auth.storeNamePlaceholder")}
            {...form.register("storeName")}
          />
        </FormField>

        <FormField label={t("auth.emailLabel")} error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            {...form.register("email")}
          />
        </FormField>

        <FormField label={t("auth.passwordLabel")} error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.passwordPlaceholder")}
            {...form.register("password")}
          />
        </FormField>

        <FormField
          label={t("auth.passwordConfirmLabel")}
          error={form.formState.errors.confirmPassword?.message}
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.passwordConfirmPlaceholder")}
            {...form.register("confirmPassword")}
          />
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("auth.signup.submit")}
        </Button>
      </form>

      <div className="text-sm text-muted-foreground">
        {t("auth.alreadyAccount")}{" "}
        <Link href={`/login?next=${encodeURIComponent(redirectPath)}`} className="text-primary">
          {t("auth.loginLink")}
        </Link>
      </div>
    </div>
  );
}
