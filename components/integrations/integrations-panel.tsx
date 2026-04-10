"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Clock3,
  Loader2,
  Lock,
  RefreshCw,
  Smartphone,
  Sparkles,
  Store,
} from "lucide-react";

import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { SetupChecklistBanner } from "@/components/dashboard/setup-checklist-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

const api = getDashboardApi();
const SHOPIFY_POLL_INTERVAL_MS = 3_000;
const SHOPIFY_POLL_TIMEOUT_MS = 60_000;
const whatsappDefaultTemplates = {
  french: {
    label: "Template FR par defaut",
    direction: "ltr" as const,
    lines: [
      "Bonjour Nom client,",
      "🙂 Merci pour votre commande chez Nom boutique (ex: Rasil).",
      "Voici les détails de votre commande : Produit(s) (ex: Jacket x1)",
      "🏠 Adresse : Adresse",
      "🏙️ Ville : Ville",
      "💰 Montant total : Prix (ex: 399 MAD)",
      "Merci de confirmer votre commande afin que nous puissions la traiter.",
    ],
    actions: [
      "↩️ Confirmer Commande",
      "↩️ Modifier la commande",
      "↩️ Annuler la commande",
    ],
  },
  arabic: {
    label: "Template AR par defaut",
    direction: "rtl" as const,
    lines: [
      "السلام عليكم Zakaria Imzilen",
      "🙂 نشكرك على الطلب ديالك معنا من Rasil",
      "ها التفاصيل ديال الطلب ديالك:",
      "Jacket x 1",
      "🏠 العنوان: Youssoufia",
      "🏙️ المدينة: Rabat",
      "💰 الثمن الإجمالي: 399 درهم",
      "عفاك أكد لينا الطلب ديالك باش نبداو الخدمة",
    ],
    actions: [
      "↩️ تأكيد الطلب",
      "↩️ تعديل الطلب",
      "↩️ إلغاء الطلب",
    ],
  },
};

function normalizeShopDomain(
  value: string,
): { kind: "ok"; normalized: string } | { kind: "error"; message: string } {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!cleaned) {
    return { kind: "error", message: "Ajoutez votre domaine Shopify." };
  }

  const bareShopPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  const fullDomainPattern =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/;

  if (fullDomainPattern.test(cleaned)) {
    return { kind: "ok", normalized: cleaned };
  }

  if (bareShopPattern.test(cleaned)) {
    return { kind: "ok", normalized: `${cleaned}.myshopify.com` };
  }

  return {
    kind: "error",
    message: "Utilisez un shop du type boutique-test ou boutique-test.myshopify.com.",
  };
}

function getWebhookBadgeVariant(webhookStatus: string | null | undefined) {
  const normalized = webhookStatus?.toLowerCase() ?? "";
  if (!normalized) return "secondary" as const;
  if (normalized.includes("healthy") || normalized.includes("active")) {
    return "success" as const;
  }
  if (normalized.includes("attention") || normalized.includes("error")) {
    return "warning" as const;
  }
  return "secondary" as const;
}

function formatWebhookLabel(webhookStatus: string | null | undefined) {
  if (!webhookStatus) return "En attente";

  return webhookStatus
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function WhatsAppTemplatePreview({
  label,
  direction,
  lines,
  actions,
}: {
  label: string;
  direction: "ltr" | "rtl";
  lines: string[];
  actions: string[];
}) {
  return (
    <div className="rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        <Badge variant="secondary">Template actif</Badge>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-border/70 bg-background">
        <div className="space-y-3 px-4 py-4 text-sm leading-6" dir={direction}>
          {lines.map((line, index) => (
            <p key={`${label}-${index}`} className="whitespace-pre-wrap text-foreground">
              {line}
            </p>
          ))}
          <div className="pt-2 text-right text-xs text-muted-foreground">12:35 PM</div>
        </div>
        <div className="border-t border-border/70">
          {actions.map((action) => (
            <div
              key={`${label}-${action}`}
              className="border-t border-border/70 px-4 py-3 text-center text-sm font-medium text-sky-600 first:border-t-0"
              dir={direction}
            >
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IntegrationsPanel({ businessId }: { businessId: number }) {
  const [shopifyDialogOpen, setShopifyDialogOpen] = useState(false);
  const [shopifyShopInput, setShopifyShopInput] = useState("");
  const [shopifyInputError, setShopifyInputError] = useState("");
  const [shopifyWaiting, setShopifyWaiting] = useState(false);
  const [shopifyWaitingStartedAt, setShopifyWaitingStartedAt] = useState<number | null>(null);
  const popupRef = useRef<Window | null>(null);
  const lastShopifyToastStatusRef = useRef<string | null>(null);

  const integrationsQuery = useQuery({
    queryKey: queryKeys.integrations(businessId),
    queryFn: () => api.getIntegrations(businessId),
  });

  const integrationsData = integrationsQuery.data;
  const checklist = integrationsData?.checklist;
  const whatsapp = integrationsData?.whatsapp;
  const platforms = integrationsData?.platforms ?? [];
  const shopify = platforms.find((platform) => platform.id === "shopify") ?? null;
  const upcomingPlatforms = platforms.filter(
    (platform) => platform.id === "youcan" || platform.id === "woocommerce",
  );
  const hasLiveBackend = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim());
  const shopifyConnectDisabledReason = !businessId
    ? "Un business doit etre selectionne avant de connecter Shopify."
    : !hasLiveBackend
      ? "La connexion Shopify necessite un backend reel. Configurez NEXT_PUBLIC_API_BASE_URL."
      : null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const shopifyStatus = url.searchParams.get("shopify_status");
    const shopifyMessage = url.searchParams.get("shopify_message");
    const shop = url.searchParams.get("shop");

    if (!shopifyStatus || lastShopifyToastStatusRef.current === shopifyStatus) return;

    if (shopifyStatus === "connected") {
      toast.success(shopifyMessage ?? `Shopify connecte${shop ? `: ${shop}` : ""}.`);
      setShopifyWaiting(false);
      setShopifyWaitingStartedAt(null);
      void integrationsQuery.refetch();
    } else if (shopifyStatus === "error") {
      toast.error(shopifyMessage ?? "La connexion Shopify n'a pas abouti.");
      setShopifyWaiting(false);
      setShopifyWaitingStartedAt(null);
    }

    lastShopifyToastStatusRef.current = shopifyStatus;

    url.searchParams.delete("shopify_status");
    url.searchParams.delete("shopify_message");
    url.searchParams.delete("business_id");
    url.searchParams.delete("shop");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [integrationsQuery]);

  useEffect(() => {
    if (!shopifyWaiting) return;

    if (shopify?.status === "connected") {
      setShopifyWaiting(false);
      setShopifyWaitingStartedAt(null);
      return;
    }

    const interval = window.setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null;
      }

      void integrationsQuery.refetch();

      if (
        shopifyWaitingStartedAt &&
        Date.now() - shopifyWaitingStartedAt > SHOPIFY_POLL_TIMEOUT_MS
      ) {
        setShopifyWaiting(false);
        setShopifyWaitingStartedAt(null);
        toast.error(
          "La connexion Shopify prend plus de temps que prevu. Verifiez la fenetre OAuth ou reessayez.",
        );
      }
    }, SHOPIFY_POLL_INTERVAL_MS);

    const onFocus = () => {
      void integrationsQuery.refetch();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "shopify-oauth-complete") return;
      void integrationsQuery.refetch();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("message", onMessage);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("message", onMessage);
    };
  }, [integrationsQuery, shopify?.status, shopifyWaiting, shopifyWaitingStartedAt]);

  function handleCopyShopDomain() {
    if (!shopify?.shop_domain || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(shopify.shop_domain);
    toast.success("Domaine Shopify copie.");
  }

  function handleOpenShopifyDialog() {
    if (shopifyConnectDisabledReason) {
      toast.error(shopifyConnectDisabledReason);
      return;
    }
    setShopifyInputError("");
    setShopifyShopInput(shopify?.shop_domain ?? "");
    setShopifyDialogOpen(true);
  }

  async function handleLaunchShopifyConnect() {
    if (shopifyConnectDisabledReason) {
      toast.error(shopifyConnectDisabledReason);
      return;
    }

    const normalized = normalizeShopDomain(shopifyShopInput);
    if (normalized.kind === "error") {
      setShopifyInputError(normalized.message);
      return;
    }
    const shopDomain = normalized.normalized;

    const returnTo = `${window.location.origin}${window.location.pathname}`;
    let authUrl: string;
    try {
      authUrl = await api.getShopifyConnectAuthUrl(businessId, shopDomain, returnTo);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de demarrer la connexion Shopify.";
      setShopifyInputError(message);
      toast.error(message);
      return;
    }
    const popup = window.open(
      authUrl,
      "shopify-connect",
      "popup=yes,width=720,height=820,resizable=yes,scrollbars=yes",
    );

    if (!popup) {
      toast.error("Impossible d'ouvrir la fenetre Shopify. Autorisez les popups puis reessayez.");
      setShopifyWaiting(false);
      setShopifyWaitingStartedAt(null);
      return;
    }

    popupRef.current = popup;
    setShopifyWaiting(true);
    setShopifyWaitingStartedAt(Date.now());
    setShopifyDialogOpen(false);
    setShopifyInputError("");
    toast.message("Connexion Shopify en attente...");
  }

  if (integrationsQuery.isError) {
    return (
      <ErrorState
        title="Integrations indisponibles"
        description="L'etat de connexion n'a pas pu etre charge."
        onRetry={() => integrationsQuery.refetch()}
      />
    );
  }

  if (!integrationsData || !checklist || !whatsapp) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Connexions"
        title="Gardez vos canaux clairs et fiables"
        description="Affichez ce qui est deja actif aujourd'hui et ce qui arrive bientot, sans promettre de connexions qui ne sont pas encore ouvertes."
      />

      {checklist.completed_count < checklist.total ? (
        <SetupChecklistBanner checklist={checklist} businessId={businessId} />
      ) : null}

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>WhatsApp Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge variant="success" className="w-fit">
                Disponible maintenant
              </Badge>
              <div className="space-y-1">
                <div className="text-lg font-medium">Envoi via le numero de l&apos;app Rasil</div>
                <div className="text-sm text-muted-foreground">
                  Pour le moment, les messages partent depuis le numero WhatsApp gere par Rasil.
                  Le branchement d&apos;un numero proprietaire viendra ensuite.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-border/70 bg-background/70 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div className="font-medium">Mode de routage WhatsApp</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-primary/25 bg-primary/8 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/12 p-2 text-primary">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <Badge variant="success">Actif</Badge>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="font-medium">Numero de l&apos;app Rasil</div>
                    <div className="text-sm text-muted-foreground">
                      Utilisez le numero gere par Rasil pour envoyer les messages clients des maintenant.
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-border/70 bg-card/80 p-3">
                    <div className="text-xs text-muted-foreground">Canal actuel</div>
                    <div className="mt-1 font-medium">
                      {whatsapp.business_name} {whatsapp.phone_number ? `- ${whatsapp.phone_number}` : ""}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Derniere activite {formatRelativeTime(whatsapp.last_activity_at)}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 opacity-80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-card p-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Badge variant="secondary">Bientot</Badge>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="font-medium">Numero WhatsApp personnalise</div>
                    <div className="text-sm text-muted-foreground">
                      Branchez votre propre numero professionnel des que cette option sera ouverte.
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="mt-4 w-full" disabled>
                    Utiliser mon propre numero
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Option visible pour preparer le futur setup, mais non disponible aujourd&apos;hui.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm text-muted-foreground">Statut</div>
                <div className="mt-2 font-medium">App phone actif</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm text-muted-foreground">Messages recus</div>
                <div className="mt-2 font-medium">{whatsapp.received_messages_last_30_days}</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm text-muted-foreground">Derniere activite</div>
                <div className="mt-2 font-medium">{formatDateTime(whatsapp.last_activity_at)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-background/70 p-5">
            <div className="mb-4 space-y-1">
              <div className="text-sm font-medium">Templates WhatsApp actuellement utilises</div>
              <div className="text-sm text-muted-foreground">
                Pour le premier envoi, Rasil utilise pour le moment les templates par defaut
                valides cote fournisseur. Le contenu ci-dessous correspond au message visible
                aujourd&apos;hui pour la confirmation initiale.
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <WhatsAppTemplatePreview {...whatsappDefaultTemplates.french} />
              <WhatsAppTemplatePreview {...whatsappDefaultTemplates.arabic} />
            </div>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/8 p-4 text-sm text-muted-foreground">
            Rasil reste l&apos;expediteur visible pour cette premiere phase. Quand les numeros
            personnalises seront disponibles, cette page gardera exactement les deux choix de
            routage deja affiches ici.
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Plateformes e-commerce</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {shopify ? (
            <Card
              className={
                shopify.status === "connected"
                  ? "border-primary/20 bg-primary/5 xl:col-span-2"
                  : "border-border/70 xl:col-span-2"
              }
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{shopify.name}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {shopify.status === "connected"
                        ? "Les commandes Shopify alimentent automatiquement les sessions de confirmation Rasil"
                        : "Connectez votre boutique Shopify pour declencher automatiquement les confirmations WhatsApp"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={shopify.status === "connected" ? "success" : "secondary"}>
                      {shopify.status === "connected" ? "Connecte" : "A connecter"}
                    </Badge>
                    {shopify.webhook_status ? (
                      <Badge variant={getWebhookBadgeVariant(shopify.webhook_status)}>
                        Webhooks: {formatWebhookLabel(shopify.webhook_status)}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {shopifyWaiting ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/8 p-3 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for Shopify connection...
                  </div>
                ) : null}

                {shopify.status === "connected" ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <div className="text-sm text-muted-foreground">Boutique connectee</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="font-medium">{shopify.shop_domain ?? "Aucun domaine"}</div>
                          {shopify.shop_domain ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={handleCopyShopDomain}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <div className="text-sm text-muted-foreground">Produits importes</div>
                        <div className="mt-2 font-medium">{shopify.imported_products}</div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <div className="text-sm text-muted-foreground">Derniere activite</div>
                        <div className="mt-2 font-medium">{formatDateTime(shopify.last_activity_at)}</div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <div className="text-sm text-muted-foreground">Derniere sync</div>
                        <div className="mt-2 font-medium">{formatDateTime(shopify.last_sync_at)}</div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <div className="text-sm text-muted-foreground">Derniere sync-back</div>
                        <div className="mt-2 font-medium">{formatDateTime(shopify.last_sync_back_at)}</div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <div className="text-sm text-muted-foreground">Statut webhook</div>
                        <div className="mt-2">
                          <Badge variant={getWebhookBadgeVariant(shopify.webhook_status)}>
                            {formatWebhookLabel(shopify.webhook_status)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button type="button" onClick={handleOpenShopifyDialog}>
                        <RefreshCw className="h-4 w-4" />
                        Reconnecter Shopify
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void integrationsQuery.refetch()}
                        disabled={integrationsQuery.isFetching}
                      >
                        {integrationsQuery.isFetching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Actualiser le statut
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-primary/15 bg-primary/8 p-4 text-sm text-muted-foreground">
                      Les nouvelles commandes Shopify alimenteront automatiquement les confirmations de commande Rasil.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                      Connectez Shopify depuis cette page pour lancer l&apos;installation OAuth,
                      revenir automatiquement dans Rasil et voir l&apos;etat reel de la connexion sans
                      recharger manuellement.
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        onClick={handleOpenShopifyDialog}
                        disabled={Boolean(shopifyConnectDisabledReason) || shopifyWaiting}
                      >
                        {shopifyWaiting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Store className="h-4 w-4" />
                        )}
                        Connecter Shopify
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void integrationsQuery.refetch()}
                        disabled={integrationsQuery.isFetching}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Actualiser
                      </Button>
                    </div>
                    {shopifyConnectDisabledReason ? (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-3 text-sm text-amber-700">
                        {shopifyConnectDisabledReason}
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
          {upcomingPlatforms.map((platform) => (
            <Card key={platform.id} className="border-dashed opacity-80">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="font-medium">{platform.name}</div>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </div>
                  <Badge variant="secondary">Bientot</Badge>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
                  Cette integration est prevue dans la roadmap, mais elle n&apos;est pas encore
                  ouverte a la connexion dans ce MVP.
                </div>
                <Button type="button" variant="outline" disabled className="w-full">
                  Disponible bientot
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={shopifyDialogOpen} onOpenChange={setShopifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connecter Shopify</DialogTitle>
            <DialogDescription>
              Saisissez votre domaine Shopify. Rasil ouvrira ensuite la fenetre
              d&apos;installation Shopify et reviendra ici des que la connexion sera terminee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="shopify-shop-domain" className="text-sm font-medium">
                Domaine Shopify
              </label>
              <Input
                id="shopify-shop-domain"
                placeholder="ma-boutique ou ma-boutique.myshopify.com"
                value={shopifyShopInput}
                onChange={(event) => {
                  setShopifyShopInput(event.target.value);
                  if (shopifyInputError) setShopifyInputError("");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Vous pouvez entrer un nom simple ou le domaine complet en
                <span className="font-medium"> .myshopify.com</span>.
              </p>
              {shopifyInputError ? (
                <p className="text-sm text-destructive">{shopifyInputError}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShopifyDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleLaunchShopifyConnect}>
              <ExternalLink className="h-4 w-4" />
              Lancer la connexion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
