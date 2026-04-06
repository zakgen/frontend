"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { useLocale } from "@/components/providers/locale-provider";
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
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
          {t("auth.supabaseMissingForgot")}
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

          const redirectTo = `${window.location.origin}/auth/confirm?next=/reset-password`;
          const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            redirectTo,
          });

          if (error) {
            toast.error(t("auth.toast.forgotError"), {
              description: error.message,
            });
            setPending(false);
            return;
          }

          toast.success(t("auth.toast.forgotSuccess"), {
            description: t("auth.toast.forgotSuccessDescription"),
          });
          form.reset();
          setPending(false);
        })}
      >
        <FormField label={t("auth.emailLabel")} error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            {...form.register("email")}
          />
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("auth.forgot.submit")}
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
