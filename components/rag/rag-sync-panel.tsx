"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCcw, Sparkles } from "lucide-react";

import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDateTime, getKnowledgeStateLabel } from "@/lib/utils";

const api = getDashboardApi();

export function RagSyncPanel({ businessId }: { businessId: number }) {
  const queryClient = useQueryClient();
  const syncQuery = useQuery({
    queryKey: queryKeys.syncStatus(businessId),
    queryFn: () => api.getSyncStatus(businessId),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.triggerSync(businessId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.syncStatus(businessId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(businessId) });
      toast.success("Votre assistant est pret", {
        description: "Il connait maintenant tous vos produits et informations boutique.",
      });
    },
    onError: () => {
      toast.error("La mise a jour n'a pas pu se terminer", {
        description: "Reessayez dans quelques instants.",
      });
    },
  });

  if (syncQuery.isError) {
    return (
      <ErrorState
        title="Connaissance IA indisponible"
        description="Le statut actuel de votre assistant n'a pas pu etre charge."
        onRetry={() => syncQuery.refetch()}
      />
    );
  }

  const data = syncQuery.data;
  const visualState = syncMutation.isPending ? "running" : data?.status ?? "recommended";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Connaissance IA"
        title="Gardez votre assistant a jour"
        description="Chaque fois que vous modifiez vos produits ou les informations de votre boutique, mettez votre assistant a jour pour conserver des reponses precises et actuelles."
      />

      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="overflow-hidden border-primary/15">
          <CardContent className="space-y-6 p-8 text-center">
            <Badge
              variant={
                visualState === "up_to_date"
                  ? "success"
                  : visualState === "recommended"
                    ? "warning"
                    : visualState === "error"
                      ? "destructive"
                      : "secondary"
              }
              className="mx-auto w-fit px-4 py-2 text-sm"
            >
              {getKnowledgeStateLabel(visualState)}
            </Badge>
            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold">
                {visualState === "up_to_date"
                  ? "Votre assistant est a jour"
                  : visualState === "recommended"
                    ? "Mise a jour recommandee"
                    : visualState === "running"
                      ? "Mise a jour en cours..."
                      : "Une intervention est necessaire"}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {visualState === "up_to_date"
                  ? `Derniere mise a jour : ${formatDateTime(data?.last_synced_at)}`
                  : visualState === "running"
                    ? "Cela prend generalement moins d'une minute."
                    : data?.last_result ?? "Votre assistant doit etre actualise pour connaitre vos dernieres modifications."}
              </p>
            </div>
            <Button size="lg" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Mettre a jour l&apos;assistant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Comment ca fonctionne ?
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Votre assistant apprend a partir de vos produits et des informations de votre boutique.
              Chaque fois que vous modifiez quelque chose, vous pouvez le mettre a jour ici pour garder
              des reponses precises et actuelles.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Ce que votre assistant connait actuellement
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <span>{data?.synced_products ?? 0} produits</span>
                <Badge variant="success">Catalogue</Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <span>Profil boutique complet</span>
                <Badge variant="success">Boutique</Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <span>{data?.synced_faqs ?? 0} FAQ indexees</span>
                <Badge variant="success">FAQ</Badge>
              </div>
              {!data?.ai_ready && data?.stale_reasons.length ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-muted-foreground">
                  {data.stale_reasons[0]}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
