"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PackageCheck,
  RefreshCcw,
} from "lucide-react";

import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { getBusinessHref } from "@/lib/routes";
import {
  formatDateTime,
  getSafeWhatsAppReadinessMessage,
} from "@/lib/utils";
import type {
  OrderConfirmationIngestResponse,
  OrderConfirmationRequest,
  OrderConfirmationSessionDetail,
} from "@/lib/types";
import {
  testOrderConfirmationSchema,
  type TestOrderConfirmationFormValues,
} from "@/lib/validators/order-confirmation";

const api = getDashboardApi();

const defaultValues: TestOrderConfirmationFormValues = {
  customer_phone: "+212600000001",
  customer_name: "Client Test Rasil",
  preferred_language: "french",
  delivery_city: "Casablanca",
  delivery_address: "Maarif, Casablanca",
  total_amount: 3499,
  items: [
    {
      product_name: "Redmi Note 13 8GB/256GB",
      quantity: 1,
      variant: "Black",
    },
  ],
};

function buildPayload(values: TestOrderConfirmationFormValues): OrderConfirmationRequest {
  return {
    source_store: "generic",
    external_order_id: `TEST-${Date.now()}`,
    customer_name: values.customer_name,
    customer_phone: values.customer_phone,
    preferred_language: values.preferred_language,
    total_amount: values.total_amount,
    currency: "MAD",
    payment_method: "cash_on_delivery",
    delivery_city: values.delivery_city,
    delivery_address: values.delivery_address,
    items: values.items,
    metadata: {
      test_run: true,
      triggered_from_ui: true,
    },
    raw_payload: {
      source: "frontend-test-button",
    },
    send_confirmation: true,
  };
}

function getErrorMessage(error: Error) {
  return getSafeWhatsAppReadinessMessage(error.message);
}

export function OrderConfirmationTestDialog({
  businessId,
  open,
  onOpenChange,
  whatsappConnected,
  disabledReason,
}: Readonly<{
  businessId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappConnected: boolean;
  disabledReason?: string | null;
}>) {
  const form = useForm<TestOrderConfirmationFormValues>({
    resolver: zodResolver(testOrderConfirmationSchema),
    defaultValues,
  });
  const [sessionDetail, setSessionDetail] = useState<OrderConfirmationSessionDetail | null>(
    null,
  );
  const [lastResult, setLastResult] = useState<OrderConfirmationIngestResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (
      values: TestOrderConfirmationFormValues,
    ): Promise<OrderConfirmationIngestResponse> => {
      if (!businessId) {
        throw new Error("Aucun businessId disponible.");
      }
      const created = await api.createOrderConfirmation(businessId, buildPayload(values));
      const refreshed = await api.getOrderConfirmationSession(
        businessId,
        created.session.id,
      );
      return {
        ...created,
        session: refreshed,
      };
    },
    onSuccess: (result) => {
      toast.success("Session de confirmation creee.");
      setSessionDetail(result.session);
      setLastResult(result);
      setSubmitError(null);
    },
    onError: (error: Error) => {
      const message = getErrorMessage(error);
      setSubmitError(message);
      toast.error("Envoi impossible", {
        description: message,
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!sessionDetail?.id) {
        throw new Error("Aucune session a rafraichir.");
      }
      return api.getOrderConfirmationSession(businessId, sessionDetail.id);
    },
    onSuccess: (detail) => {
      setSessionDetail(detail);
      toast.success("Session rafraichie.");
    },
    onError: (error: Error) => {
      toast.error("Impossible de rafraichir la session.", {
        description: getErrorMessage(error),
      });
    },
  });

  const submitDisabled =
    createMutation.isPending || !businessId || !whatsappConnected || Boolean(disabledReason);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setSubmitError(null);
        }
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Envoyer une confirmation test</DialogTitle>
          <DialogDescription>
            Envoyez une commande test au backend puis inspectez la session de confirmation creee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {disabledReason ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-700">
              {disabledReason}
            </div>
          ) : null}

          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => {
              setSubmitError(null);
              createMutation.mutate(values);
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Telephone client"
                error={form.formState.errors.customer_phone?.message}
              >
                <Input {...form.register("customer_phone")} />
              </FormField>

              <FormField
                label="Nom client"
                error={form.formState.errors.customer_name?.message}
              >
                <Input {...form.register("customer_name")} />
              </FormField>

              <Controller
                control={form.control}
                name="preferred_language"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Langue preferee"
                    error={fieldState.error?.message}
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une langue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="french">Francais</SelectItem>
                        <SelectItem value="darija">Darija</SelectItem>
                        <SelectItem value="english">Anglais</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />

              <FormField
                label="Montant total"
                error={form.formState.errors.total_amount?.message}
              >
                <Input type="number" min="1" step="1" {...form.register("total_amount")} />
              </FormField>

              <FormField
                label="Ville de livraison"
                error={form.formState.errors.delivery_city?.message}
              >
                <Input {...form.register("delivery_city")} />
              </FormField>

              <FormField
                label="Adresse de livraison"
                error={form.formState.errors.delivery_address?.message}
              >
                <Input {...form.register("delivery_address")} />
              </FormField>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-primary" />
                <div className="font-medium">Article par defaut</div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <FormField
                  label="Nom produit"
                  error={form.formState.errors.items?.[0]?.product_name?.message}
                >
                  <Input {...form.register("items.0.product_name")} />
                </FormField>
                <FormField
                  label="Quantite"
                  error={form.formState.errors.items?.[0]?.quantity?.message}
                >
                  <Input type="number" min="1" {...form.register("items.0.quantity")} />
                </FormField>
                <FormField
                  label="Variante"
                  error={form.formState.errors.items?.[0]?.variant?.message}
                >
                  <Input {...form.register("items.0.variant")} />
                </FormField>
              </div>
            </div>

            <DialogFooter className="gap-3 sm:justify-between">
              <div className="text-xs text-muted-foreground">
                External order id genere automatiquement a l&apos;envoi.
              </div>
              <Button type="submit" disabled={submitDisabled}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Envoyer la confirmation test
              </Button>
            </DialogFooter>
          </form>

          {lastResult && sessionDetail ? (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Session creee</div>
                    <div className="text-sm text-muted-foreground">
                      Verifiez immediatement si la confirmation WhatsApp a ete envoyee.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => refreshMutation.mutate()}
                      disabled={refreshMutation.isPending}
                    >
                      {refreshMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      Rafraichir la session
                    </Button>
                    <Button asChild type="button" variant="ghost">
                      <Link href={getBusinessHref(businessId, "/order-confirmations")}>
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir la vue sessions
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ResultCard label="Order id" value={lastResult.order.id} />
                  <ResultCard label="Commande externe" value={lastResult.order.external_order_id} />
                  <ResultCard label="Session id" value={sessionDetail.id} />
                  <ResultCard label="Statut session" value={sessionDetail.status} />
                  <ResultCard
                    label="Message envoye"
                    value={lastResult.confirmation_message_sent ? "true" : "false"}
                    tone={lastResult.confirmation_message_sent ? "success" : "warning"}
                  />
                  <ResultCard label="Telephone client" value={sessionDetail.phone} />
                  <ResultCard
                    label="Langue preferee"
                    value={sessionDetail.preferred_language || "Non renseignee"}
                  />
                </div>

                <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                  <div className="mb-3 flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Liste des evenements
                  </div>
                  {sessionDetail.events.length ? (
                    <div className="space-y-3">
                      {sessionDetail.events.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-2xl border border-border/70 bg-card/80 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium">{event.event_type}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(event.created_at)}
                            </div>
                          </div>
                          <Textarea
                            readOnly
                            value={JSON.stringify(event.payload, null, 2)}
                            className="mt-3 min-h-[120px] bg-background/60 font-mono text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Aucun evenement detaille retourne pour cette session.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultCard({
  label,
  value,
  tone = "default",
}: Readonly<{
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}>) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {tone === "success" ? <Badge variant="success">OK</Badge> : null}
        {tone === "warning" ? <Badge variant="warning">Check</Badge> : null}
      </div>
    </div>
  );
}
