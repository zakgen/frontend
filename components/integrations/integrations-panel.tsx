"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
  MessageCircleMore,
  Send,
  Smartphone,
  Sparkles,
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

export function IntegrationsPanel({ businessId }: { businessId: number }) {
  const [testOpen, setTestOpen] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Est-ce que vous livrez a Fes ?");
  const [testResponse, setTestResponse] = useState("");

  const integrationsQuery = useQuery({
    queryKey: queryKeys.integrations(businessId),
    queryFn: () => api.getIntegrations(businessId),
  });

  const businessQuery = useQuery({
    queryKey: queryKeys.business(businessId),
    queryFn: () => api.getBusiness(businessId),
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Integrations"
        title="Gardez vos connexions claires et fiables"
        description="Affichez ce qui est deja actif aujourd'hui et ce qui arrive bientot, sans promettre de connexions qui ne sont pas encore ouvertes."
      />

      {checklist.completed_count < checklist.total ? (
        <SetupChecklistBanner checklist={checklist} />
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
                <div className="text-lg font-medium">Envoi via le numero de l&apos;app ZakBot</div>
                <div className="text-sm text-muted-foreground">
                  Pour le moment, les messages partent depuis le numero WhatsApp gere par ZakBot.
                  Le branchement d&apos;un numero proprietaire viendra ensuite.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setTestOpen(true)}>
                <MessageCircleMore className="h-4 w-4" />
                Tester une reponse
              </Button>
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
                    <div className="font-medium">Numero de l&apos;app ZakBot</div>
                    <div className="text-sm text-muted-foreground">
                      Utilisez le numero gere par ZakBot pour envoyer les messages clients des maintenant.
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

          <div className="rounded-2xl border border-primary/15 bg-primary/8 p-4 text-sm text-muted-foreground">
            ZakBot reste l&apos;expediteur visible pour cette premiere phase. Quand les numeros
            personnalises seront disponibles, cette page gardera exactement les deux choix de
            routage deja affiches ici.
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Autres integrations</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platforms.map((platform) => (
            <Card key={platform.id} className="border-dashed opacity-80">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="font-medium">{platform.name}</div>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </div>
                  <Badge variant="secondary">Soon</Badge>
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

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Bientot disponibles</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {coming_soon.map((item) => (
            <Card key={item.id} className="opacity-60">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{item.name}</div>
                  <Badge variant="secondary">Soon</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{item.description}</div>
                <Button variant="ghost" className="h-auto px-0 text-primary" disabled>
                  En attente
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
