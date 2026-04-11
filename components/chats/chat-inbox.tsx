"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Loader2,
  RefreshCcw,
  Search,
  SendHorizonal,
  UserRound,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { getBusinessHref } from "@/lib/routes";
import { getDateGroupLabel, getIntentMeta, formatDateTime, formatRelativeTime, maskPhoneNumber } from "@/lib/utils";
import type { ConversationIntent, ConversationMessage, ConversationSummary } from "@/lib/types";

const api = getDashboardApi();

type ChatScope = "all" | "order_confirmations" | "ai_assistant";
type ChatContext = {
  message_context?: ConversationSummary["message_context"] | ConversationMessage["message_context"] | null;
  order_window_status?: ConversationSummary["order_window_status"] | ConversationMessage["order_window_status"] | null;
  order_session_id?: string | null;
  order_id?: string | null;
  order_external_id?: string | null;
};

function groupByDate(conversations: ConversationSummary[]) {
  return conversations.reduce<Record<string, ConversationSummary[]>>((acc, conversation) => {
    const label = getDateGroupLabel(conversation.last_timestamp);
    acc[label] ??= [];
    acc[label].push(conversation);
    return acc;
  }, {});
}

function isOutsideWindowSkippedMessage(message: ConversationMessage) {
  return (
    message.direction === "outbound" &&
    message.provider_status === "skipped_window" &&
    message.error_code === "outside_24h_window"
  );
}

function normalizeScope(value?: string | null): ChatScope {
  if (value === "order-confirmations" || value === "order_confirmations") {
    return "order_confirmations";
  }
  if (value === "ai-assistant" || value === "ai_assistant") {
    return "ai_assistant";
  }
  return "all";
}

function matchesScope(chat: ConversationSummary, scope: ChatScope) {
  if (scope === "all") return true;
  if (scope === "order_confirmations") {
    return chat.message_context === "order_confirmation";
  }
  return chat.message_context !== "order_confirmation";
}

function getFlowMeta(context: ChatContext) {
  if (context.message_context === "order_confirmation") {
    return {
      label: "Order confirmation",
      variant:
        context.order_window_status === "closed"
          ? ("secondary" as const)
          : ("warning" as const),
      windowLabel:
        context.order_window_status === "ongoing"
          ? "Window ongoing"
          : context.order_window_status === "closed"
            ? "Window closed"
            : null,
      helper:
        context.order_window_status === "closed"
          ? "This conversation is linked to the latest order-confirmation flow, but the order window is now closed."
          : "This conversation belongs to the latest order-confirmation flow and order actions are still available.",
    };
  }

  return {
    label: "AI assistant",
    variant: "outline" as const,
    windowLabel: null,
    helper: "This conversation is handled as an inbound assistant chat.",
  };
}

export function ChatInbox({
  businessId,
  initialPhone,
  initialScope,
}: {
  businessId: number;
  initialPhone?: string;
  initialScope?: string;
}) {
  const { t } = useLocale();
  const initialPhoneAppliedRef = useRef(false);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [intent, setIntent] = useState("all");
  const [direction, setDirection] = useState("all");
  const [scope, setScope] = useState<ChatScope>(() => normalizeScope(initialScope));
  const [needsHumanOnly, setNeedsHumanOnly] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState("");
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const chatsQuery = useQuery({
    queryKey: queryKeys.chats(businessId, {
      phone: phoneSearch || undefined,
      intent: intent === "all" ? undefined : intent,
      direction: direction === "all" ? undefined : direction,
      needs_human: needsHumanOnly ? "true" : undefined,
    }),
    queryFn: () =>
      api.getChats(businessId, {
        phone: phoneSearch || undefined,
        intent: intent === "all" ? "all" : (intent as ConversationIntent),
        direction: direction === "all" ? "all" : (direction as "inbound" | "outbound"),
        needs_human: needsHumanOnly || undefined,
      }),
  });

  const scopedChats = useMemo(
    () =>
      (chatsQuery.data ?? []).filter((chat) =>
        (initialPhone && chat.phone === initialPhone) ||
        matchesScope(chat, scope),
      ),
    [chatsQuery.data, scope, initialPhone],
  );

  useEffect(() => {
    if (!scopedChats.length) {
      setSelectedPhone(null);
      return;
    }

    if (
      !initialPhoneAppliedRef.current &&
      initialPhone &&
      scopedChats.some((item) => item.phone === initialPhone)
    ) {
      initialPhoneAppliedRef.current = true;
      setSelectedPhone(initialPhone);
      return;
    }

    if (!selectedPhone || !scopedChats.some((item) => item.phone === selectedPhone)) {
      setSelectedPhone(scopedChats[0].phone);
    }
  }, [scopedChats, selectedPhone, initialPhone]);

  const intents = useMemo(
    () => Array.from(new Set((chatsQuery.data ?? []).flatMap((chat) => chat.intents))).sort(),
    [chatsQuery.data],
  );
  const groups = useMemo(() => groupByDate(scopedChats), [scopedChats]);

  const threadQuery = useQuery({
    queryKey: queryKeys.thread(businessId, selectedPhone),
    queryFn: () => api.getChatThread(businessId, selectedPhone as string),
    enabled: Boolean(selectedPhone),
  });

  const selectedSummary = useMemo(
    () => scopedChats.find((chat) => chat.phone === selectedPhone) ?? null,
    [scopedChats, selectedPhone],
  );
  const latestThreadContextMessage = useMemo(() => {
    const messages = threadQuery.data?.messages ?? [];
    return [...messages]
      .reverse()
      .find((message) => message.message_context != null || message.order_window_status != null);
  }, [threadQuery.data?.messages]);
  const threadContext: ChatContext = {
    message_context:
      selectedSummary?.message_context ??
      latestThreadContextMessage?.message_context ??
      ((initialScope === "order-confirmations" || initialScope === "order_confirmations") &&
      selectedPhone === initialPhone
        ? "order_confirmation"
        : "general"),
    order_window_status:
      selectedSummary?.order_window_status ??
      latestThreadContextMessage?.order_window_status ??
      null,
    order_session_id:
      selectedSummary?.order_session_id ?? latestThreadContextMessage?.order_session_id ?? null,
    order_id: selectedSummary?.order_id ?? latestThreadContextMessage?.order_id ?? null,
    order_external_id:
      selectedSummary?.order_external_id ?? latestThreadContextMessage?.order_external_id ?? null,
  };
  const threadFlowMeta = getFlowMeta(threadContext);
  const hasActiveOrderWindow =
    threadContext.message_context === "order_confirmation" &&
    threadContext.order_window_status === "ongoing";
  const hasClosedOrderWindow =
    threadContext.message_context === "order_confirmation" &&
    threadContext.order_window_status === "closed";
  const orderConfirmationHref = threadContext.order_session_id
    ? `${getBusinessHref(businessId, "/order-confirmations")}?sessionId=${encodeURIComponent(threadContext.order_session_id)}`
    : getBusinessHref(businessId, "/order-confirmations");

  useEffect(() => {
    if (!threadQuery.data?.messages.length) return;

    requestAnimationFrame(() => {
      threadEndRef.current?.scrollIntoView({
        block: "end",
      });
    });
  }, [selectedPhone, threadQuery.data?.messages.length]);

  const replyMutation = useMutation({
    mutationFn: async () => {
      const text = draftReply.trim();
      if (!selectedPhone) {
        throw new Error("Aucune conversation selectionnee.");
      }
      if (!text) {
        throw new Error("Le message ne peut pas etre vide.");
      }
      return api.sendChatReply(businessId, selectedPhone, { text });
    },
    onSuccess: async () => {
      setDraftReply("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chats", businessId] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.thread(businessId, selectedPhone),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.overview(businessId) }),
      ]);
      toast.success("Message envoye sur WhatsApp.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Impossible d'envoyer le message.");
    },
  });

  function handleSendReply() {
    if (!draftReply.trim()) {
      toast.error("Ecrivez une reponse avant l'envoi.");
      return;
    }
    replyMutation.mutate();
  }

  if (chatsQuery.isError) {
    return (
      <ErrorState
        title={t("chats.unavailableTitle")}
        description={t("chats.unavailableDescription")}
        onRetry={() => chatsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("chats.eyebrow")}
        title={t("chats.title")}
        description={t("chats.description")}
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid min-h-[760px] grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="border-b border-border/70 bg-card/70 xl:border-b-0 xl:border-r">
              <div className="space-y-3 p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={phoneSearch}
                    onChange={(event) => setPhoneSearch(event.target.value)}
                    placeholder={t("chats.searchPhone")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={scope} onValueChange={(value) => setScope(value as ChatScope)}>
                    <SelectTrigger className="col-span-2">
                      <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All chats</SelectItem>
                      <SelectItem value="order_confirmations">Order confirmations</SelectItem>
                      <SelectItem value="ai_assistant">AI assistant</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={intent} onValueChange={setIntent}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("chats.intent")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("chats.allIntents")}</SelectItem>
                      {intents.map((item) => (
                        <SelectItem key={item} value={item}>
                          {getIntentMeta(item).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("chats.direction")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("chats.allDirections")}</SelectItem>
                      <SelectItem value="inbound">{t("chats.inbound")}</SelectItem>
                      <SelectItem value="outbound">{t("chats.outbound")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => setNeedsHumanOnly((current) => !current)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    needsHumanOnly
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                      : "border-border bg-background/70 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {t("chats.humanOnly")}
                </button>
              </div>
              <Separator />

              <ScrollArea className="h-[660px]">
                <div className="p-3">
                  {chatsQuery.isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-24" />
                      ))}
                    </div>
                  ) : scopedChats.length ? (
                    Object.entries(groups).map(([label, items]) => (
                      <div key={label} className="mb-4">
                        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {label}
                        </div>
                        <div className="space-y-2">
                          {items.map((chat) => {
                            const flowMeta = getFlowMeta(chat);
                            return (
                            <button
                              key={chat.phone}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                selectedPhone === chat.phone
                                  ? "border-primary/30 bg-primary/8"
                                  : "border-transparent hover:border-border hover:bg-muted/60"
                              }`}
                              onClick={() => setSelectedPhone(chat.phone)}
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {chat.customer_name ?? "Cliente"}
                                  </div>
                                  <div className="truncate text-sm text-muted-foreground">
                                    {maskPhoneNumber(chat.phone)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {chat.needs_human ? (
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                  ) : null}
                                  {formatRelativeTime(chat.last_timestamp)}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm text-muted-foreground">{chat.last_message}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant={flowMeta.variant}>{flowMeta.label}</Badge>
                                {flowMeta.windowLabel ? (
                                  <Badge variant="outline">{flowMeta.windowLabel}</Badge>
                                ) : null}
                                {chat.intents.slice(0, 2).map((item) => (
                                  <Badge key={item} variant={getIntentMeta(item).variant}>
                                    {getIntentMeta(item).label}
                                  </Badge>
                                ))}
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3">
                      <EmptyState
                        title="Aucune conversation ne correspond"
                        description="Essayez de retirer un filtre ou d'elargir votre recherche."
                      />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="bg-card/20">
              {selectedPhone ? (
                threadQuery.isError ? (
                  <div className="p-6">
                    <ErrorState
                      title="Conversation indisponible"
                      description="Le fil selectionne n'a pas pu etre charge."
                      onRetry={() => threadQuery.refetch()}
                    />
                  </div>
                ) : threadQuery.isLoading || !threadQuery.data ? (
                  <div className="space-y-4 p-6">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-28 w-2/3" />
                    <Skeleton className="ml-auto h-24 w-1/2" />
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="border-b border-border/70 bg-background/80 p-6">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted p-3 text-muted-foreground">
                            <UserRound className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {threadQuery.data.customer_name ?? "Cliente"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {threadQuery.data.phone}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>{threadQuery.data.messages.length} messages</span>
                          <span>Premier contact : {formatDateTime(threadQuery.data.first_contact_at)}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void Promise.all([
                                threadQuery.refetch(),
                                chatsQuery.refetch(),
                              ]);
                            }}
                            disabled={threadQuery.isFetching || chatsQuery.isFetching}
                          >
                            {threadQuery.isFetching || chatsQuery.isFetching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="h-4 w-4" />
                            )}
                            Actualiser
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 p-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={threadFlowMeta.variant}>{threadFlowMeta.label}</Badge>
                            {threadFlowMeta.windowLabel ? (
                              <Badge variant="outline">{threadFlowMeta.windowLabel}</Badge>
                            ) : null}
                            {selectedSummary?.needs_human ? (
                              <Badge variant="warning">Relais humain</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">{threadFlowMeta.helper}</p>
                          {threadContext.message_context === "order_confirmation" ? (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {threadContext.order_session_id ? (
                                <span>Session: {threadContext.order_session_id}</span>
                              ) : null}
                              {threadContext.order_id ? <span>Order: {threadContext.order_id}</span> : null}
                              {threadContext.order_external_id ? (
                                <span>External: {threadContext.order_external_id}</span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              New orders go through Order Confirmations. Inbound questions and follow-ups are handled in Chats.
                            </div>
                          )}
                        </div>
                        {threadContext.message_context === "order_confirmation" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={orderConfirmationHref}>
                              <ClipboardCheck className="h-4 w-4" />
                              {hasActiveOrderWindow ? "Open order actions" : "Open order context"}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <ScrollArea className="h-[520px] xl:h-[560px]">
                      <div className="space-y-4 p-6">
                        {threadQuery.data.messages.some((message) => message.needs_human) ? (
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-700">
                            Cette conversation peut demander un relais humain.
                          </div>
                        ) : null}

                        {threadQuery.data.messages.map((message) => {
                          const inbound = message.direction === "inbound";
                          const skippedOutsideWindow = isOutsideWindowSkippedMessage(message);
                          const messageFlowMeta = getFlowMeta(message);
                          return (
                            <div
                              key={message.id}
                              className={`flex ${inbound ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[82%] rounded-[22px] px-4 py-3 shadow-sm ${
                                  inbound
                                    ? "rounded-bl-md border border-border/70 bg-card"
                                    : "rounded-br-md bg-primary text-primary-foreground"
                                }`}
                              >
                                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                                  <Badge variant={inbound ? "outline" : "secondary"}>
                                    {inbound ? "Entrant" : "Sortant"}
                                  </Badge>
                                  <Badge variant={messageFlowMeta.variant}>{messageFlowMeta.label}</Badge>
                                  {messageFlowMeta.windowLabel ? (
                                    <Badge variant="outline">{messageFlowMeta.windowLabel}</Badge>
                                  ) : null}
                                  {message.intent ? (
                                    <Badge variant={getIntentMeta(message.intent).variant}>
                                      {getIntentMeta(message.intent).label}
                                    </Badge>
                                  ) : null}
                                  {message.needs_human ? (
                                    <Badge variant="warning">Relais humain</Badge>
                                  ) : null}
                                  {skippedOutsideWindow ? (
                                    <Badge variant="warning">Non envoye</Badge>
                                  ) : null}
                                </div>
                                <p className={`text-sm leading-6 ${inbound ? "text-foreground" : ""}`}>
                                  {message.text}
                                </p>
                                {skippedOutsideWindow ? (
                                  <div
                                    className={`mt-3 rounded-2xl border border-amber-500/25 px-3 py-2 text-xs ${
                                      inbound
                                        ? "bg-amber-500/10 text-amber-700"
                                        : "bg-black/10 text-primary-foreground"
                                    }`}
                                  >
                                    Not sent (outside 24h window)
                                  </div>
                                ) : null}
                                <div
                                  className={`mt-3 text-xs ${
                                    inbound ? "text-muted-foreground" : "text-primary-foreground/80"
                                  }`}
                                >
                                  {formatDateTime(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={threadEndRef} />
                      </div>
                    </ScrollArea>
                    <div className="border-t border-border/70 bg-background/90 p-4">
                      <div className="space-y-3 rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm">
                        {hasActiveOrderWindow ? (
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs text-amber-700">
                            This thread is inside an active order-confirmation window. Use Order Confirmations for confirm, edit, and cancel actions.
                          </div>
                        ) : null}
                        {hasClosedOrderWindow ? (
                          <div className="space-y-3 rounded-2xl border border-slate-400/20 bg-slate-500/5 px-3 py-3 text-xs text-muted-foreground">
                            <div>This thread is linked to a closed order-confirmation window. Order actions are now read-only.</div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="outline" size="sm" disabled>
                                Confirm
                              </Button>
                              <Button type="button" variant="outline" size="sm" disabled>
                                Edit
                              </Button>
                              <Button type="button" variant="outline" size="sm" disabled>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : null}
                        <Textarea
                          value={draftReply}
                          onChange={(event) => setDraftReply(event.target.value)}
                          placeholder="Ecrivez une reponse WhatsApp claire et concise..."
                          className="min-h-[120px] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                          maxLength={1600}
                          disabled={replyMutation.isPending}
                          onKeyDown={(event) => {
                            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                              event.preventDefault();
                              handleSendReply();
                            }
                          }}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-muted-foreground">
                            {draftReply.trim().length}/1600
                            <span className="ml-2">Cmd/Ctrl + Enter pour envoyer</span>
                          </div>
                          <Button
                            type="button"
                            onClick={handleSendReply}
                            disabled={replyMutation.isPending || !draftReply.trim()}
                          >
                            {replyMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Envoi...
                              </>
                            ) : (
                              <>
                                <SendHorizonal className="mr-2 h-4 w-4" />
                                Envoyer
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="Selectionnez une conversation"
                    description="Choisissez une conversation a gauche pour voir le fil complet et la reponse de l'assistant."
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
