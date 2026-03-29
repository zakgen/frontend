"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserRound } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { getDateGroupLabel, getIntentMeta, formatDateTime, formatRelativeTime, maskPhoneNumber } from "@/lib/utils";
import type { ConversationIntent, ConversationSummary } from "@/lib/types";

const api = getDashboardApi();

function groupByDate(conversations: ConversationSummary[]) {
  return conversations.reduce<Record<string, ConversationSummary[]>>((acc, conversation) => {
    const label = getDateGroupLabel(conversation.last_timestamp);
    acc[label] ??= [];
    acc[label].push(conversation);
    return acc;
  }, {});
}

export function ChatInbox({ businessId }: { businessId: number }) {
  const [phoneSearch, setPhoneSearch] = useState("");
  const [intent, setIntent] = useState("all");
  const [direction, setDirection] = useState("all");
  const [needsHumanOnly, setNeedsHumanOnly] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

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

  useEffect(() => {
    if (!chatsQuery.data?.length) {
      setSelectedPhone(null);
      return;
    }

    if (!selectedPhone || !chatsQuery.data.some((item) => item.phone === selectedPhone)) {
      setSelectedPhone(chatsQuery.data[0].phone);
    }
  }, [chatsQuery.data, selectedPhone]);

  const intents = useMemo(
    () => Array.from(new Set((chatsQuery.data ?? []).flatMap((chat) => chat.intents))).sort(),
    [chatsQuery.data],
  );
  const groups = useMemo(() => groupByDate(chatsQuery.data ?? []), [chatsQuery.data]);

  const threadQuery = useQuery({
    queryKey: queryKeys.thread(businessId, selectedPhone),
    queryFn: () => api.getChatThread(businessId, selectedPhone as string),
    enabled: Boolean(selectedPhone),
  });

  if (chatsQuery.isError) {
    return (
      <ErrorState
        title="Conversations indisponibles"
        description="Les conversations WhatsApp n'ont pas pu etre chargees."
        onRetry={() => chatsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Conversations"
        title="Passez en revue les echanges avec vos clientes"
        description="Consultez vos conversations comme une boite de reception, reperez l'intention principale et les cas qui demandent un relais humain."
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
                    placeholder="Rechercher un numero"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={intent} onValueChange={setIntent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Intention" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les intentions</SelectItem>
                      {intents.map((item) => (
                        <SelectItem key={item} value={item}>
                          {getIntentMeta(item).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="inbound">Entrant</SelectItem>
                      <SelectItem value="outbound">Sortant</SelectItem>
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
                  Montrer seulement les conversations qui demandent un relais humain
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
                  ) : chatsQuery.data?.length ? (
                    Object.entries(groups).map(([label, items]) => (
                      <div key={label} className="mb-4">
                        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {label}
                        </div>
                        <div className="space-y-2">
                          {items.map((chat) => (
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
                                {chat.intents.slice(0, 2).map((item) => (
                                  <Badge key={item} variant={getIntentMeta(item).variant}>
                                    {getIntentMeta(item).label}
                                  </Badge>
                                ))}
                              </div>
                            </button>
                          ))}
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
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="h-[660px]">
                      <div className="space-y-4 p-6">
                        {threadQuery.data.messages.some((message) => message.needs_human) ? (
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-700">
                            Cette conversation peut demander un relais humain.
                          </div>
                        ) : null}

                        {threadQuery.data.messages.map((message) => {
                          const inbound = message.direction === "inbound";
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
                                  {message.intent ? (
                                    <Badge variant={getIntentMeta(message.intent).variant}>
                                      {getIntentMeta(message.intent).label}
                                    </Badge>
                                  ) : null}
                                  {message.needs_human ? (
                                    <Badge variant="warning">Relais humain</Badge>
                                  ) : null}
                                </div>
                                <p className={`text-sm leading-6 ${inbound ? "text-foreground" : ""}`}>
                                  {message.text}
                                </p>
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
                      </div>
                    </ScrollArea>
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
