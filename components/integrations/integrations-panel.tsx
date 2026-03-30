"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Cable, CheckCircle2, Loader2, MessageCircleMore, Send } from "lucide-react";

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
import type { CommercePlatformId } from "@/lib/types";

const api = getDashboardApi();

export function IntegrationsPanel({ businessId }: { businessId: number }) {
  const queryClient = useQueryClient();
  const [testOpen, setTestOpen] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Est-ce que vous livrez a Fes ?");
  const [testResponse, setTestResponse] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const integrationsQuery = useQuery({
    queryKey: queryKeys.integrations(businessId),
    queryFn: () => api.getIntegrations(businessId),
  });

  const businessQuery = useQuery({
    queryKey: queryKeys.business(businessId),
    queryFn: () => api.getBusiness(businessId),
  });

  const whatsappMutation = useMutation({
    mutationFn: (status: "connected" | "disconnected") =>
      api.setWhatsAppConnection(businessId, status, {
        phoneNumber: phoneNumber.trim() || integrationsQuery.data?.whatsapp.phone_number,
        businessName:
          businessQuery.data?.name || integrationsQuery.data?.whatsapp.business_name,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.integrations(businessId), data);
      setPhoneNumber(data.whatsapp.phone_number);
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(businessId) });
      toast.success(
        data.whatsapp.status === "connected"
          ? "WhatsApp connecte"
          : "WhatsApp deconnecte",
      );
    },
  });

  const platformMutation = useMutation({
    mutationFn: (platformId: CommercePlatformId) => api.runCommerceSync(businessId, platformId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.integrations(businessId), data);
      toast.success("Synchronisation terminee");
    },
  });

  const testMutation = useMutation({
    mutationFn: () => api.sendWhatsAppTestMessage(businessId, testPrompt),
    onSuccess: (reply) => {
      setTestResponse(reply);
    },
  });

  if (integrationsQuery.isError) {
    return (
      <ErrorState
        title="Integrations indisponibles"
        description="L'etat de connexion n'a pas pu etre charge."
        onRetry={() => integrationsQuery.refetch()}
      />
    );
  }

  if (!integrationsQuery.data) return null;

  const { checklist, whatsapp, platforms, coming_soon } = integrationsQuery.data;
  const resolvedPhoneNumber = phoneNumber || whatsapp.phone_number;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Integrations"
        title="Gardez vos connexions claires et fiables"
        description="Connectez WhatsApp Business, suivez l'etat de vos flux et synchronisez vos catalogues depuis vos plateformes e-commerce."
      />

      {checklist.completed_count < checklist.total ? (
        <SetupChecklistBanner checklist={checklist} />
      ) : null}

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>WhatsApp Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge variant={whatsapp.status === "connected" ? "success" : "warning"} className="w-fit">
                {whatsapp.status === "connected" ? "Connecte" : "Non connecte"}
              </Badge>
              <div className="space-y-1">
                <div className="text-lg font-medium">
                  {whatsapp.status === "connected"
                    ? whatsapp.phone_number
                    : "Connectez votre numero WhatsApp Business"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {whatsapp.status === "connected"
                    ? `${whatsapp.business_name} - Derniere activite ${formatRelativeTime(whatsapp.last_activity_at)}`
                    : "Permettez a ZakBot de repondre automatiquement aux clientes sur WhatsApp."}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {whatsapp.status === "connected" ? (
                <>
                  <Button variant="outline" onClick={() => setTestOpen(true)}>
                    <MessageCircleMore className="h-4 w-4" />
                    Envoyer un message test
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => whatsappMutation.mutate("disconnected")}
                    disabled={whatsappMutation.isPending}
                  >
                    Deconnecter
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => whatsappMutation.mutate("connected")}
                  disabled={whatsappMutation.isPending || !resolvedPhoneNumber.trim()}
                >
                  {whatsappMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cable className="h-4 w-4" />}
                  Connecter avec Meta
                </Button>
              )}
            </div>
          </div>

          {whatsapp.status === "connected" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm text-muted-foreground">Statut</div>
                <div className="mt-2 font-medium">Actif</div>
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
          ) : (
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
                <div className="space-y-3">
                <div className="font-medium">Etapes de connexion</div>
                <div className="text-sm text-muted-foreground">1. Entrez votre numero WhatsApp Business</div>
                <Input
                  value={resolvedPhoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+212600000000"
                />
                <div className="text-sm text-muted-foreground">2. Connectez-vous via votre compte Meta Business</div>
                <div className="text-sm text-muted-foreground">3. Testez la connexion une fois activee</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Plateformes e-commerce</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platforms.map((platform) => (
            <Card key={platform.id}>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <div className="font-medium">{platform.name}</div>
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                </div>
                {platform.status === "connected" ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      {platform.imported_products} produits importes
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Derniere sync : {formatRelativeTime(platform.last_sync_at)}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => platformMutation.mutate(platform.id)}
                      disabled={platformMutation.isPending}
                    >
                      Synchroniser maintenant
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => platformMutation.mutate(platform.id)}
                    disabled={platformMutation.isPending}
                  >
                    Connecter
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Bientot disponibles</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {coming_soon.map((item) => (
            <Card key={item.id} className="opacity-60">
              <CardContent className="space-y-3 p-5">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.description}</div>
                <Button variant="ghost" className="h-auto px-0 text-primary">
                  M&apos;avertir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un message test</DialogTitle>
            <DialogDescription>
              Verifiez en quelques secondes le type de reponse que votre assistant donnerait a une cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} />
            <Button onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
              {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Tester la reponse
            </Button>
            {testResponse ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground">
                {testResponse}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setTestOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
