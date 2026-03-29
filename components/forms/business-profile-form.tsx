"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Save, Sparkles } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { FAQEditor } from "@/components/forms/faq-editor";
import { FormField } from "@/components/forms/form-field";
import { PaymentMethodSelector } from "@/components/forms/payment-method-selector";
import { StringListInput } from "@/components/forms/string-list-input";
import { ToneSelector } from "@/components/forms/tone-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";
import { businessProfileSchema, type BusinessProfileFormValues } from "@/lib/validators/business";

const api = getDashboardApi();

const defaultValues: BusinessProfileFormValues = {
  name: "",
  summary: "",
  niche: "",
  city: "",
  supported_languages: [],
  tone_of_voice: "friendly",
  opening_hours: [],
  delivery_zones: [],
  delivery_time: "",
  shipping_policy: "",
  return_policy: "",
  payment_methods: [],
  faq: [],
  order_rules: [],
  escalation_contact: "",
  upsell_rules: [],
};

function SectionCard({
  title,
  count,
  total,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div>
          <div className="font-medium">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {count}/{total} champs remplis
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{count}/{total}</Badge>
          <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
        </div>
      </button>
      {open ? <CardContent className="pt-0">{children}</CardContent> : null}
    </Card>
  );
}

export function BusinessProfileForm({ businessId }: { businessId: number }) {
  const queryClient = useQueryClient();
  const [openSection, setOpenSection] = useState("shop");
  const form = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues,
  });

  const businessQuery = useQuery({
    queryKey: queryKeys.business(businessId),
    queryFn: () => api.getBusiness(businessId),
  });
  const syncQuery = useQuery({
    queryKey: queryKeys.syncStatus(businessId),
    queryFn: () => api.getSyncStatus(businessId),
  });

  useEffect(() => {
    if (businessQuery.data) {
      form.reset({
        name: businessQuery.data.name,
        summary: businessQuery.data.summary,
        niche: businessQuery.data.niche,
        city: businessQuery.data.city,
        supported_languages: businessQuery.data.supported_languages,
        tone_of_voice: businessQuery.data.tone_of_voice,
        opening_hours: businessQuery.data.opening_hours,
        delivery_zones: businessQuery.data.delivery_zones,
        delivery_time: businessQuery.data.delivery_time,
        shipping_policy: businessQuery.data.shipping_policy,
        return_policy: businessQuery.data.return_policy,
        payment_methods: businessQuery.data.payment_methods,
        faq: businessQuery.data.faq,
        order_rules: businessQuery.data.order_rules,
        escalation_contact: businessQuery.data.escalation_contact,
        upsell_rules: businessQuery.data.upsell_rules,
      });
    }
  }, [businessQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: BusinessProfileFormValues) => api.updateBusiness(businessId, values),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.business(businessId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus(businessId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(businessId) });
      toast.success("Modifications enregistrees", {
        description: "N'oubliez pas de mettre a jour votre assistant pour appliquer ces changements.",
      });
      form.reset(valuesFromProfile(data));
    },
    onError: () => {
      toast.error("Impossible d'enregistrer", {
        description: "Verifiez les champs puis reessayez.",
      });
    },
  });

  if (businessQuery.isError) {
    return (
      <ErrorState
        title="Profil indisponible"
        description="Le profil de votre boutique n'a pas pu etre charge."
        onRetry={() => businessQuery.refetch()}
      />
    );
  }

  const values = form.watch();
  const shopCount = [
    values.name,
    values.summary,
    values.niche,
    values.city,
    values.supported_languages.length,
    values.tone_of_voice,
    values.opening_hours.length,
  ].filter(Boolean).length;
  const deliveryCount = [
    values.delivery_zones.length,
    values.delivery_time,
    values.shipping_policy,
    values.payment_methods.length,
  ].filter(Boolean).length;
  const policyCount = [
    values.return_policy,
    values.order_rules.length,
    values.faq.length,
  ].filter(Boolean).length;
  const responseCount = [values.escalation_contact, values.upsell_rules.length].filter(Boolean).length;

  return (
    <div className="space-y-8 pb-28">
      <PageHeader
        eyebrow="Profil de la boutique"
        title="Coachez votre assistant comme un membre de l'equipe"
        description="Ces informations aident ZakBot a repondre avec le bon ton, les bonnes politiques et les bons details produits."
        trailing={
          <div className="rounded-3xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-primary">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Plus votre profil est clair, meilleures sont les reponses
            </div>
          </div>
        }
      />

      {syncQuery.data && !syncQuery.data.ai_ready ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium text-amber-700">Mettez a jour votre assistant</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {syncQuery.data.last_result}
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/rag">Ouvrir Connaissance IA</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <form onSubmit={form.handleSubmit((formValues) => updateMutation.mutate(formValues))} className="space-y-5">
        <SectionCard
          title="Votre boutique"
          count={shopCount}
          total={7}
          open={openSection === "shop"}
          onToggle={() => setOpenSection(openSection === "shop" ? "" : "shop")}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Nom de la boutique" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Boutique Al Warda" />
            </FormField>
            <FormField label="Secteur" error={form.formState.errors.niche?.message}>
              <Input {...form.register("niche")} placeholder="Mode feminine" />
            </FormField>
            <FormField label="Ville" error={form.formState.errors.city?.message}>
              <Input {...form.register("city")} placeholder="Casablanca" />
            </FormField>
            <Controller
              control={form.control}
              name="tone_of_voice"
              render={({ field, fieldState }) => (
                <FormField
                  label="Ton de voix"
                  description="Choisissez comment votre assistant s'adresse aux clientes."
                  error={fieldState.error?.message}
                  className="md:col-span-2"
                >
                  <ToneSelector value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />
            <FormField
              label="Resume de la boutique"
              className="md:col-span-2"
              description="L'assistant utilisera ce texte pour presenter votre boutique."
              error={form.formState.errors.summary?.message}
            >
              <Textarea {...form.register("summary")} />
            </FormField>
            <Controller
              control={form.control}
              name="supported_languages"
              render={({ field, fieldState }) => (
                <FormField
                  label="Langues prises en charge"
                  description="Ajoutez les langues que votre assistant peut utiliser."
                  error={fieldState.error?.message}
                >
                  <StringListInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Darija, Francais, Arabe..."
                  />
                </FormField>
              )}
            />
            <Controller
              control={form.control}
              name="opening_hours"
              render={({ field, fieldState }) => (
                <FormField
                  label="Horaires"
                  description="Ajoutez une ligne par plage horaire."
                  error={fieldState.error?.message}
                >
                  <StringListInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Lun - Sam : 09:00 - 19:00"
                  />
                </FormField>
              )}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Livraison & paiement"
          count={deliveryCount}
          total={4}
          open={openSection === "delivery"}
          onToggle={() => setOpenSection(openSection === "delivery" ? "" : "delivery")}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Controller
              control={form.control}
              name="delivery_zones"
              render={({ field, fieldState }) => (
                <FormField
                  label="Zones de livraison"
                  description="Listez les villes ou regions que vous desservez."
                  error={fieldState.error?.message}
                >
                  <StringListInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ajoutez une ville"
                  />
                </FormField>
              )}
            />
            <FormField
              label="Delai de livraison"
              description="Exemple : 24 a 48 heures"
              error={form.formState.errors.delivery_time?.message}
            >
              <Input {...form.register("delivery_time")} />
            </FormField>
            <Controller
              control={form.control}
              name="payment_methods"
              render={({ field, fieldState }) => (
                <FormField
                  label="Modes de paiement"
                  description="Affichez clairement vos options de paiement."
                  error={fieldState.error?.message}
                  className="md:col-span-2"
                >
                  <PaymentMethodSelector value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />
            <FormField
              label="Politique de livraison"
              className="md:col-span-2"
              error={form.formState.errors.shipping_policy?.message}
            >
              <Textarea {...form.register("shipping_policy")} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard
          title="Politiques"
          count={policyCount}
          total={3}
          open={openSection === "policies"}
          onToggle={() => setOpenSection(openSection === "policies" ? "" : "policies")}
        >
          <div className="space-y-5">
            <FormField label="Politique de retour" error={form.formState.errors.return_policy?.message}>
              <Textarea {...form.register("return_policy")} />
            </FormField>
            <Controller
              control={form.control}
              name="order_rules"
              render={({ field, fieldState }) => (
                <FormField
                  label="Regles de commande"
                  description="Ajoutez les regles que l'assistant doit suivre avant de confirmer une commande."
                  error={fieldState.error?.message}
                >
                  <StringListInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Toujours confirmer la taille et la ville"
                  />
                </FormField>
              )}
            />
            <Controller
              control={form.control}
              name="faq"
              render={({ field }) => (
                <FormField
                  label="FAQ"
                  description="Ajoutez les questions les plus frequentes pour guider l'assistant."
                >
                  <FAQEditor value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Reponses automatiques"
          count={responseCount}
          total={2}
          open={openSection === "responses"}
          onToggle={() => setOpenSection(openSection === "responses" ? "" : "responses")}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Contact de relais humain"
              description="Ou rediriger les demandes complexes ou urgentes."
              error={form.formState.errors.escalation_contact?.message}
            >
              <Input {...form.register("escalation_contact")} placeholder="service@..." />
            </FormField>
            <Controller
              control={form.control}
              name="upsell_rules"
              render={({ field, fieldState }) => (
                <FormField
                  label="Regles d'upsell"
                  description="Definissez quand proposer un lot ou un produit complementaire."
                  error={fieldState.error?.message}
                >
                  <StringListInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Proposer un accessoire assorti a partir de 250 MAD"
                  />
                </FormField>
              )}
            />
          </div>
        </SectionCard>
      </form>

      {form.formState.isDirty ? (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-xl items-center justify-between rounded-2xl border border-border bg-card/95 p-4 shadow-soft backdrop-blur-sm">
            <div>
              <div className="text-sm font-medium">Modifications non enregistrees</div>
              <div className="text-xs text-muted-foreground">
                Enregistrez pour appliquer les changements a votre boutique.
              </div>
            </div>
            <Button
              size="lg"
              onClick={form.handleSubmit((formValues) => updateMutation.mutate(formValues))}
              disabled={updateMutation.isPending || businessQuery.isLoading}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function valuesFromProfile(data: Awaited<ReturnType<typeof api.getBusiness>>): BusinessProfileFormValues {
  return {
    name: data.name,
    summary: data.summary,
    niche: data.niche,
    city: data.city,
    supported_languages: data.supported_languages,
    tone_of_voice: data.tone_of_voice,
    opening_hours: data.opening_hours,
    delivery_zones: data.delivery_zones,
    delivery_time: data.delivery_time,
    shipping_policy: data.shipping_policy,
    return_policy: data.return_policy,
    payment_methods: data.payment_methods,
    faq: data.faq,
    order_rules: data.order_rules,
    escalation_contact: data.escalation_contact,
    upsell_rules: data.upsell_rules,
  };
}
