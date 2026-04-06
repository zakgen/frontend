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
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
          {t("auth.supabaseMissingReset")}
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

          const { error } = await supabase.auth.updateUser({
            password: values.password,
          });

          if (error) {
            toast.error(t("auth.toast.resetError"), {
              description: error.message,
            });
            setPending(false);
            return;
          }

          toast.success(t("auth.toast.resetSuccess"));
          router.replace("/");
          router.refresh();
        })}
      >
        <FormField label={t("auth.newPasswordLabel")} error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.passwordPlaceholder")}
            {...form.register("password")}
          />
        </FormField>

        <FormField
          label={t("auth.newPasswordConfirmLabel")}
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
          {t("auth.reset.submit")}
        </Button>
      </form>

      <div className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
