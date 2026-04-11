"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Boxes,
  Bot,
  ClipboardCheck,
  MessageSquareText,
  MessagesSquare,
  Sparkles,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { useLocale } from "@/components/providers/locale-provider";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { getBusinessHref } from "@/lib/routes";
import {
  formatCurrency,
  formatRelativeTime,
  getIntentMeta,
  getStockStatusLabel,
  maskPhoneNumber,
} from "@/lib/utils";

const api = getDashboardApi();

export function OverviewPanel({ businessId }: { businessId: number }) {
  const { t } = useLocale();
  const overviewQuery = useQuery({
    queryKey: queryKeys.overview(businessId),
    queryFn: () => api.getOverview(businessId),
  });
  const orderConfirmationsQuery = useQuery({
    queryKey: queryKeys.orderConfirmations(businessId, "all"),
    queryFn: () => api.listOrderConfirmationSessions(businessId, "all"),
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
        title={t("dashboard.overview.unavailableTitle")}
        description={t("dashboard.overview.unavailableDescription")}
        onRetry={() => overviewQuery.refetch()}
      />
    );
  }

  const { stats, recent_chats, recent_products, ai_insight, sync_notice } =
    overviewQuery.data;
  const orderSessions = orderConfirmationsQuery.data?.sessions ?? [];
  const orderMetrics = {
    awaiting: orderSessions.filter((session) => session.status === "awaiting_customer").length,
    confirmed: orderSessions.filter((session) => session.status === "confirmed").length,
    declined: orderSessions.filter((session) => session.status === "declined").length,
    needsHuman: orderSessions.filter((session) => session.needs_human).length,
  };
  const chatMetrics = {
    total: stats.total_conversations,
    inbound: recent_chats.reduce((sum, chat) => sum + chat.inbound_count, 0),
    needsHuman: recent_chats.filter((chat) => chat.needs_human).length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("dashboard.overview.eyebrow")}
        title={t("dashboard.overview.title")}
        description={t("dashboard.overview.description")}
      />

      {sync_notice ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium text-amber-700">{t("dashboard.overview.updateRecommended")}</div>
              <p className="mt-1 text-sm text-muted-foreground">{sync_notice}</p>
            </div>
            <Button asChild>
              <Link href={getBusinessHref(businessId, "/rag")}>{t("dashboard.overview.updateAssistant")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-500/15 bg-slate-500/5">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Bot className="h-4 w-4" />
                Chats / AI Assistant
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Inbound WhatsApp conversations and assistant replies are reviewed in Chats.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Conversations" value={chatMetrics.total.toString()} />
              <MiniMetric label="Inbound messages" value={chatMetrics.inbound.toString()} />
              <MiniMetric label="Needs human" value={chatMetrics.needsHuman.toString()} />
            </div>
            <Button asChild variant="outline">
              <Link href={`${getBusinessHref(businessId, "/chats")}?scope=ai-assistant`}>
                Open Chats
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/6">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <ClipboardCheck className="h-4 w-4" />
                Auto Order Confirmation
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                New orders go through Order Confirmations before an operator needs to step in.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <MiniMetric label="Awaiting" value={orderMetrics.awaiting.toString()} />
              <MiniMetric label="Confirmed" value={orderMetrics.confirmed.toString()} />
              <MiniMetric label="Declined" value={orderMetrics.declined.toString()} />
              <MiniMetric label="Needs human" value={orderMetrics.needsHuman.toString()} />
            </div>
            <Button asChild variant="outline">
              <Link href={getBusinessHref(businessId, "/order-confirmations")}>
                Open Order Confirmations
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.overview.stats.conversations")}
          value={stats.total_conversations.toString()}
          detail={t("dashboard.overview.today")}
          icon={<MessagesSquare className="h-5 w-5" />}
        />
        <StatCard
          label={t("dashboard.overview.stats.messagesHandled")}
          value={stats.messages_handled.toString()}
          detail={t("dashboard.overview.allDirections")}
          icon={<MessageSquareText className="h-5 w-5" />}
        />
        <StatCard
          label={t("dashboard.overview.stats.activeProducts")}
          value={stats.active_products.toString()}
          detail={t("dashboard.overview.catalogAvailable")}
          icon={<Boxes className="h-5 w-5" />}
        />
        <StatCard
          label={t("dashboard.overview.stats.knowledge")}
          value={stats.ai_knowledge_status}
          detail={t("dashboard.overview.currentState")}
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
            <CardTitle>{t("dashboard.overview.recentProducts")}</CardTitle>
            <Button asChild variant="ghost" className="h-auto px-0 text-primary">
              <Link href={getBusinessHref(businessId, "/products")}>{t("dashboard.overview.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recent_products.length === 0 ? (
              <EmptyState
                title={t("dashboard.overview.noProductsTitle")}
                description={t("dashboard.overview.noProductsDescription")}
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
            <CardTitle>{t("dashboard.overview.recentChats")}</CardTitle>
            <Button asChild variant="ghost" className="h-auto px-0 text-primary">
              <Link href={getBusinessHref(businessId, "/chats")}>{t("dashboard.overview.viewAllChats")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recent_chats.length === 0 ? (
              <EmptyState
                title={t("dashboard.overview.noChatsTitle")}
                description={t("dashboard.overview.noChatsDescription")}
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
                    {chat.needs_human ? <Badge variant="warning">{t("dashboard.overview.humanRelay")}</Badge> : null}
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
