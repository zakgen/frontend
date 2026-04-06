"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCcw, Sparkles } from "lucide-react";

import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDateTime, getKnowledgeStateLabel } from "@/lib/utils";

const api = getDashboardApi();

export function RagSyncPanel({ businessId }: { businessId: number }) {
  const { t } = useLocale();
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
      toast.success(t("rag.toastSuccess"), {
        description: t("rag.toastSuccessDescription"),
      });
    },
    onError: () => {
      toast.error(t("rag.toastError"), {
        description: t("rag.toastErrorDescription"),
      });
    },
  });

  if (syncQuery.isError) {
    return (
      <ErrorState
        title={t("rag.unavailableTitle")}
        description={t("rag.unavailableDescription")}
        onRetry={() => syncQuery.refetch()}
      />
    );
  }

  const data = syncQuery.data;
  const visualState = syncMutation.isPending ? "running" : data?.status ?? "recommended";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("rag.eyebrow")}
        title={t("rag.title")}
        description={t("rag.description")}
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
                  ? t("rag.status.up_to_date")
                  : visualState === "recommended"
                    ? t("rag.status.recommended")
                    : visualState === "running"
                      ? t("rag.status.running")
                      : t("rag.status.error")}
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
              {t("rag.button")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {t("rag.howItWorks")}
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
              {t("rag.whatItKnows")}
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
