"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Loader2, MapPin, Plus, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { RasilLogo } from "@/components/brand/rasil-logo";
import { FormField } from "@/components/forms/form-field";
import { useBusinessContext } from "@/components/providers/business-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { getBusinessHref } from "@/lib/routes";
import {
  createBusinessSchema,
  type CreateBusinessFormValues,
} from "@/lib/validators/business-account";
import { formatRelativeTime } from "@/lib/utils";

const api = getDashboardApi();

export function BusinessesScreen({
  userEmail,
}: Readonly<{
  userEmail: string | null;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { businesses, currentBusinessId, isLoading, errorMessage, setCurrentBusinessId } =
    useBusinessContext();
  const { locale, t } = useLocale();

  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
      description: "",
      city: "",
      shipping_policy: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateBusinessFormValues) => api.createMyBusiness(values),
    onSuccess: async (business) => {
      setCurrentBusinessId(business.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.myBusinesses() });
      toast.success(t("businesses.creationSuccess"), {
        description: t("businesses.creationSuccessDescription"),
      });
      router.push(getBusinessHref(business.id, "/business"));
      router.refresh();
    },
    onError: (error) => {
      toast.error(t("businesses.creationError"), {
        description:
          error instanceof Error
            ? error.message
            : locale === "fr"
              ? "Vérifiez les informations puis réessayez."
              : "Check the information and try again.",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-8 px-4 py-6 lg:px-6">
        <header className="rounded-[30px] border border-border/80 bg-card/92 p-5 shadow-panel backdrop-blur-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 rounded-[22px] border border-border/70 bg-background/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <RasilLogo variant="icon" className="w-full" priority />
              </div>
              <div>
                <div className="font-display text-3xl font-semibold tracking-[-0.05em]">
                  Rasil
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {locale === "fr"
                    ? "Choisissez la boutique que vous voulez piloter ou créez-en une nouvelle."
                    : "Choose the store you want to operate or create a new one."}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher />
              <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-2 text-sm text-muted-foreground">
                {userEmail ?? (locale === "fr" ? "Session active" : "Active session")}
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 surface-lines opacity-40" />
            <CardContent className="relative p-6 lg:p-8">
                <Badge className="mb-4">{locale === "fr" ? "Espace boutiques" : "Stores space"}</Badge>
                <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-[-0.06em] text-foreground">
                  {businesses.length === 0
                  ? t("businesses.title.zero")
                  : t("businesses.title.many")}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t("businesses.description")}
                </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-border/70 bg-background/75 p-5">
                  <div className="flex items-center gap-3 text-primary">
                    <Building2 className="h-5 w-5" />
                    <div className="font-medium">{t("businesses.pilotageTitle")}</div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("businesses.pilotageDescription")}
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-background/75 p-5">
                  <div className="flex items-center gap-3 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                    <div className="font-medium">{t("businesses.authTitle")}</div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("businesses.authDescription")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("businesses.newBusiness")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
              >
                <FormField label={t("businesses.name")} error={form.formState.errors.name?.message}>
                  <Input
                    placeholder={t("businesses.namePlaceholder")}
                    autoFocus={businesses.length === 0}
                    {...form.register("name")}
                  />
                </FormField>

                <FormField
                  label={t("businesses.descriptionLabel")}
                  description={t("businesses.optional")}
                  error={form.formState.errors.description?.message}
                >
                  <Textarea
                    rows={4}
                    placeholder={t("businesses.descriptionPlaceholder")}
                    {...form.register("description")}
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label={t("businesses.city")} description={t("businesses.optional")}>
                    <Input placeholder={t("businesses.cityPlaceholder")} {...form.register("city")} />
                  </FormField>
                  <FormField label={t("businesses.shippingPolicy")} description={t("businesses.optional")}>
                    <Input
                      placeholder={t("businesses.shippingPolicyPlaceholder")}
                      {...form.register("shipping_policy")}
                    />
                  </FormField>
                </div>

                {errorMessage && businesses.length === 0 ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t("businesses.create")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.05em]">
                {t("businesses.listTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {businesses.length === 0
                  ? t("businesses.noneYet")
                  : businesses.length === 1
                    ? t("businesses.availableCount.one")
                    : t("businesses.availableCount.other", { count: businesses.length })}
              </p>
            </div>
            {isLoading ? (
              <Badge variant="secondary">
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                {locale === "fr" ? "Chargement" : "Loading"}
              </Badge>
            ) : null}
          </div>

          {businesses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="font-medium">{t("businesses.noneYet")}</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("businesses.noneYetDescription")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {businesses.map((business) => {
                const active = business.id === currentBusinessId;

                return (
                  <Card
                    key={business.id}
                    className={active ? "border-primary/35 shadow-soft" : undefined}
                  >
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{business.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {business.description || t("businesses.descriptionMissing")}
                          </div>
                        </div>
                        {active ? <Badge>{locale === "fr" ? "Actuelle" : "Current"}</Badge> : null}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{business.city || t("businesses.cityMissing")}</span>
                        </div>
                        <div>
                          {locale === "fr" ? "Mise à jour " : "Updated "}
                          {business.updated_at
                            ? formatRelativeTime(business.updated_at)
                            : t("businesses.updatedRecent")}
                        </div>
                      </div>

                      <Button asChild className="w-full">
                        <Link href={getBusinessHref(business.id)} onClick={() => setCurrentBusinessId(business.id)}>
                          {t("businesses.open")}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
