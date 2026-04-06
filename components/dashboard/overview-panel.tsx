"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Bot, MessageSquareText, MessagesSquare, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { SetupChecklistBanner } from "@/components/dashboard/setup-checklist-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import {
  formatCurrency,
  formatRelativeTime,
  getIntentMeta,
  getStockStatusLabel,
  maskPhoneNumber,
} from "@/lib/utils";

const api = getDashboardApi();

export function OverviewPanel({ businessId }: { businessId: number }) {
  const overviewQuery = useQuery({
    queryKey: queryKeys.overview(businessId),
    queryFn: () => api.getOverview(businessId),
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-28 w-full rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorState
        title="Tableau de bord indisponible"
        description="Les indicateurs du jour n'ont pas pu etre charges."
        onRetry={() => overviewQuery.refetch()}
      />
    );
  }

  const { stats, recent_chats, recent_products, ai_insight, sync_notice, checklist } =
    overviewQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tableau de bord"
        title="Le point rapide sur vos operations"
        description="En quelques secondes, voyez si Rasil suit bien les conversations, si votre catalogue est a jour et s'il reste une etape de configuration a terminer."
      />

      {checklist.completed_count < checklist.total ? (
        <SetupChecklistBanner checklist={checklist} compact />
      ) : null}

      {sync_notice ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium text-amber-700">Mise a jour recommandee</div>
              <p className="mt-1 text-sm text-muted-foreground">{sync_notice}</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/rag">Mettre a jour l&apos;assistant</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Conversations"
          value={stats.total_conversations.toString()}
          detail="Aujourd'hui"
          icon={<MessagesSquare className="h-5 w-5" />}
        />
        <StatCard
          label="Messages traites"
          value={stats.messages_handled.toString()}
          detail="Toutes directions confondues"
          icon={<MessageSquareText className="h-5 w-5" />}
        />
        <StatCard
          label="Produits actifs"
          value={stats.active_products.toString()}
          detail="Disponibles dans le catalogue"
          icon={<Boxes className="h-5 w-5" />}
        />
        <StatCard
          label="Connaissance IA"
          value={stats.ai_knowledge_status}
          detail="Etat actuel de l'assistant"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-primary/15 bg-primary/5">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 font-medium text-primary">
              <Bot className="h-4 w-4" />
              {ai_insight.title}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{ai_insight.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Produits recents</CardTitle>
            <Button asChild variant="ghost" className="h-auto px-0 text-primary">
              <Link href="/dashboard/products">Voir tous</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recent_products.length === 0 ? (
              <EmptyState
                title="Aucun produit pour l'instant"
                description="Ajoutez vos produits pour que votre assistant puisse les recommander."
              />
            ) : (
              recent_products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.category}</div>
                    </div>
                    <Badge
                      variant={
                        product.stock_status === "out_of_stock"
                          ? "destructive"
                          : product.stock_status === "low_stock"
                            ? "warning"
                            : "success"
                      }
                    >
                      {getStockStatusLabel(product.stock_status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {product.variants.length} variante{product.variants.length > 1 ? "s" : ""}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Conversations recentes</CardTitle>
            <Button asChild variant="ghost" className="h-auto px-0 text-primary">
              <Link href="/dashboard/chats">Voir toutes</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recent_chats.length === 0 ? (
              <EmptyState
                title="Aucune conversation"
                description="Des que des clientes vous ecrivent sur WhatsApp, leurs conversations apparaissent ici."
              />
            ) : (
              recent_chats.map((chat) => (
                <div key={chat.phone} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{chat.customer_name ?? "Cliente"}</div>
                      <div className="text-sm text-muted-foreground">{maskPhoneNumber(chat.phone)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(chat.last_timestamp)}
                    </div>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {chat.last_message}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chat.intents.slice(0, 2).map((intent) => (
                      <Badge key={intent} variant={getIntentMeta(intent).variant}>
                        {getIntentMeta(intent).label}
                      </Badge>
                    ))}
                    {chat.needs_human ? <Badge variant="warning">Relais humain</Badge> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
