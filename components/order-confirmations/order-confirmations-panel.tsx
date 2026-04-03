"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BotMessageSquare,
  CheckCircle2,
  Clock3,
  Loader2,
  PhoneCall,
  RefreshCcw,
  Search,
  ShieldAlert,
  SquarePen,
  Undo2,
  XCircle,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import {
  cn,
  formatCurrency,
  formatDateTime,
  getSafeWhatsAppReadinessMessage,
  maskPhoneNumber,
} from "@/lib/utils";
import type {
  OrderConfirmationAction,
  OrderConfirmationSessionDetail,
  OrderConfirmationSessionStatus,
  OrderConfirmationSessionSummary,
} from "@/lib/types";

const api = getDashboardApi();

const statusOptions: Array<{
  value: OrderConfirmationSessionStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Tous les statuts" },
  { value: "awaiting_customer", label: "Awaiting customer" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "edit_requested", label: "Edit requested" },
  { value: "human_requested", label: "Human requested" },
];

const actionConfig: Record<
  OrderConfirmationAction,
  { label: string; variant: "default" | "outline" | "destructive"; confirm?: boolean }
> = {
  confirm: { label: "Confirm", variant: "default" },
  decline: { label: "Decline", variant: "destructive", confirm: true },
  request_edit: { label: "Request edit", variant: "outline" },
  request_human: { label: "Request human", variant: "outline" },
  reopen: { label: "Reopen", variant: "outline", confirm: true },
  resend: { label: "Resend", variant: "outline", confirm: true },
};

function getStatusMeta(status: OrderConfirmationSessionStatus) {
  switch (status) {
    case "awaiting_customer":
      return { label: "Awaiting customer", variant: "warning" as const };
    case "confirmed":
      return { label: "Confirmed", variant: "success" as const };
    case "declined":
      return { label: "Declined", variant: "destructive" as const };
    case "edit_requested":
      return { label: "Edit requested", variant: "outline" as const };
    case "human_requested":
      return { label: "Human requested", variant: "secondary" as const };
    case "pending_send":
      return { label: "Pending send", variant: "secondary" as const };
    case "expired":
      return { label: "Expired", variant: "outline" as const };
  }
}

function filterSessions(
  sessions: OrderConfirmationSessionSummary[],
  search: string,
) {
  const needle = search.trim().toLowerCase();
  if (!needle) return sessions;

  return sessions.filter((session) =>
    [
      session.customer_name,
      session.phone,
      session.id,
      session.order_id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

export function OrderConfirmationsPanel({ businessId }: { businessId: number }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] =
    useState<OrderConfirmationSessionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<OrderConfirmationAction | null>(null);
  const [actionNote, setActionNote] = useState("");

  const listQuery = useQuery({
    queryKey: queryKeys.orderConfirmations(businessId, statusFilter),
    queryFn: () => api.listOrderConfirmationSessions(businessId, statusFilter),
    enabled: Boolean(businessId),
  });

  const filteredSessions = useMemo(
    () => filterSessions(listQuery.data?.sessions ?? [], search),
    [listQuery.data?.sessions, search],
  );

  useEffect(() => {
    if (!selectedSessionId && filteredSessions.length) {
      setSelectedSessionId(filteredSessions[0].id);
      return;
    }

    if (
      selectedSessionId &&
      filteredSessions.length &&
      !filteredSessions.some((session) => session.id === selectedSessionId)
    ) {
      setSelectedSessionId(filteredSessions[0].id);
    }
  }, [filteredSessions, selectedSessionId]);

  const detailQuery = useQuery({
    queryKey: queryKeys.orderConfirmationSession(businessId, selectedSessionId),
    queryFn: () => api.getOrderConfirmationSession(businessId, selectedSessionId as string),
    enabled: Boolean(businessId && selectedSessionId),
  });

  const actionMutation = useMutation({
    mutationFn: () =>
      api.applyOrderConfirmationAction(businessId, selectedSessionId as string, {
        action: pendingAction as OrderConfirmationAction,
        note: actionNote.trim() || undefined,
      }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        queryKeys.orderConfirmationSession(businessId, detail.id),
        detail,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.orderConfirmations(businessId, statusFilter),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.orderConfirmationSession(businessId, detail.id),
        }),
      ]);
      toast.success("Session mise a jour.");
      setActionDialogOpen(false);
      setPendingAction(null);
      setActionNote("");
    },
    onError: (error: Error) => {
      toast.error("Action impossible", {
        description: getSafeWhatsAppReadinessMessage(error.message),
      });
    },
  });

  if (!businessId) {
    return (
      <EmptyState
        title="Business context required"
        description="Select a business before opening order confirmation sessions."
        icon={<ShieldAlert className="h-8 w-8" />}
      />
    );
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        title="Sessions indisponibles"
        description="Impossible de charger les order confirmation sessions."
        onRetry={() => listQuery.refetch()}
      />
    );
  }

  const metrics = {
    total: listQuery.data?.total ?? 0,
    awaiting: (listQuery.data?.sessions ?? []).filter(
      (session) => session.status === "awaiting_customer",
    ).length,
    confirmed: (listQuery.data?.sessions ?? []).filter(
      (session) => session.status === "confirmed",
    ).length,
    needsHuman: (listQuery.data?.sessions ?? []).filter((session) => session.needs_human).length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Order Confirmations"
        title="Suivez les confirmations de commande WhatsApp"
        description="Inspectez les sessions actives, verifiez l'historique des evenements et appliquez des actions manuelles quand le flux doit etre assiste."
        trailing={
          <Button
            variant="outline"
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
          >
            {listQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total sessions" value={metrics.total} />
        <MetricCard label="Awaiting customer" value={metrics.awaiting} />
        <MetricCard label="Confirmed" value={metrics.confirmed} />
        <MetricCard label="Needs human" value={metrics.needsHuman} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Sessions</CardTitle>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher par customer, phone, session id ou order id"
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as OrderConfirmationSessionStatus | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {listQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredSessions.length ? (
              <ScrollArea className="h-[720px] pr-2">
                <div className="space-y-3">
                  {filteredSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className={cn(
                        "w-full rounded-3xl border p-4 text-left transition",
                        selectedSessionId === session.id
                          ? "border-primary/30 bg-primary/8 shadow-soft"
                          : "border-border/70 bg-background/70 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {session.customer_name || "Client sans nom"}
                            </span>
                            <StatusBadge status={session.status} />
                            {session.needs_human ? (
                              <Badge variant="warning">Needs human</Badge>
                            ) : null}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {maskPhoneNumber(session.phone)}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>Session #{session.id}</div>
                          <div>Order #{session.order_id}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <MiniInfo label="Language" value={session.preferred_language || "N/A"} />
                        <MiniInfo
                          label="Intent"
                          value={session.last_detected_intent || "Aucun"}
                        />
                        <MiniInfo
                          label="Started"
                          value={formatDateTime(session.started_at)}
                        />
                        <MiniInfo
                          label="Last customer message"
                          value={formatDateTime(session.last_customer_message_at)}
                        />
                        <MiniInfo
                          label="Updated"
                          value={formatDateTime(session.updated_at)}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No order confirmation sessions yet."
                description="Les nouvelles sessions apparaitront ici des qu'une commande lance un flux de confirmation."
                icon={<BotMessageSquare className="h-8 w-8" />}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session detail</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!selectedSessionId ? (
              <EmptyState
                title="Select a session"
                description="Choisissez une session a gauche pour ouvrir son detail complet."
              />
            ) : detailQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-52 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : detailQuery.isError || !detailQuery.data ? (
              <ErrorState
                title="Detail indisponible"
                description="Impossible de charger cette session."
                onRetry={() => detailQuery.refetch()}
              />
            ) : (
              <SessionDetail
                detail={detailQuery.data}
                onOpenAction={(action) => {
                  setPendingAction(action);
                  setActionDialogOpen(true);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        action={pendingAction}
        note={actionNote}
        onNoteChange={setActionNote}
        onConfirm={() => actionMutation.mutate()}
        pending={actionMutation.isPending}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={cn("mt-2 text-3xl font-semibold", tone === "warning" && "text-amber-700")}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: OrderConfirmationSessionStatus }) {
  const meta = getStatusMeta(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function SessionDetail({
  detail,
  onOpenAction,
}: {
  detail: OrderConfirmationSessionDetail;
  onOpenAction: (action: OrderConfirmationAction) => void;
}) {
  const order = detail.order;

  return (
    <ScrollArea className="h-[720px] pr-2">
      <div className="space-y-6">
        <section className="space-y-4">
          <SectionTitle title="Session summary" />
          <div className="grid gap-3 md:grid-cols-2">
            <MiniInfo label="Session id" value={detail.id} />
            <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={detail.status} />
                {detail.needs_human ? <Badge variant="warning">Needs human</Badge> : null}
              </div>
            </div>
            <MiniInfo label="Preferred language" value={detail.preferred_language || "N/A"} />
            <MiniInfo label="Last detected intent" value={detail.last_detected_intent || "Aucun"} />
            <MiniInfo label="Started at" value={formatDateTime(detail.started_at)} />
            <MiniInfo label="Confirmed at" value={formatDateTime(detail.confirmed_at)} />
            <MiniInfo label="Declined at" value={formatDateTime(detail.declined_at)} />
            <MiniInfo label="Updated at" value={formatDateTime(detail.updated_at)} />
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="Order details" />
          <div className="grid gap-3 md:grid-cols-2">
            <MiniInfo label="External order id" value={order.external_order_id} />
            <MiniInfo label="Source store" value={order.source_store} />
            <MiniInfo label="Customer name" value={order.customer_name || "N/A"} />
            <MiniInfo label="Customer phone" value={order.customer_phone} />
            <MiniInfo label="Delivery city" value={order.delivery_city || "N/A"} />
            <MiniInfo label="Delivery address" value={order.delivery_address || "N/A"} />
            <MiniInfo
              label="Total amount"
              value={formatCurrency(order.total_amount, order.currency)}
            />
            <MiniInfo label="Payment method" value={order.payment_method || "N/A"} />
            <MiniInfo label="Order status" value={order.status} />
            <MiniInfo label="Confirmation status" value={order.confirmation_status} />
          </div>
          {order.order_notes ? (
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="text-xs text-muted-foreground">Order notes</div>
              <div className="mt-2 text-sm">{order.order_notes}</div>
            </div>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="Items" />
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={`${item.product_name}-${index}`} className="rounded-3xl border border-border/70 bg-card/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Quantite {item.quantity}
                      {item.variant ? ` • Variant ${item.variant}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {item.unit_price != null ? formatCurrency(item.unit_price, order.currency) : "Prix non precise"}
                  </div>
                </div>
                {item.sku ? (
                  <div className="mt-3 text-xs text-muted-foreground">SKU {item.sku}</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="Event timeline" />
          {detail.events.length ? (
            <div className="space-y-3">
              {detail.events.map((event) => (
                <div key={event.id} className="rounded-3xl border border-border/70 bg-card/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-medium">{event.event_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(event.created_at)}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {Object.keys(event.payload).length ? (
                      Object.entries(event.payload).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-2xl border border-border/60 bg-background/70 p-3"
                        >
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            {key}
                          </div>
                          <div className="mt-1 text-sm whitespace-pre-wrap break-words">
                            {formatEventValue(value)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Aucun payload detaille.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Aucun evenement pour cette session.
            </div>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="Manual actions" />
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                "confirm",
                "decline",
                "request_edit",
                "request_human",
                "reopen",
                "resend",
              ] as OrderConfirmationAction[]
            ).map((action) => {
              const config = actionConfig[action];
              const Icon = getActionIcon(action);

              return (
                <Button
                  key={action}
                  type="button"
                  variant={config.variant}
                  className="justify-start"
                  onClick={() => onOpenAction(action)}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>;
}

function formatEventValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "N/A";
  return JSON.stringify(value, null, 2);
}

function getActionIcon(action: OrderConfirmationAction) {
  switch (action) {
    case "confirm":
      return CheckCircle2;
    case "decline":
      return XCircle;
    case "request_edit":
      return SquarePen;
    case "request_human":
      return PhoneCall;
    case "reopen":
      return Undo2;
    case "resend":
      return RefreshCcw;
  }
}

function ActionDialog({
  open,
  onOpenChange,
  action,
  note,
  onNoteChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: OrderConfirmationAction | null;
  note: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  if (!action) return null;

  const config = actionConfig[action];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.label}</DialogTitle>
          <DialogDescription>
            {config.confirm
              ? "Confirmez cette action avant de l'envoyer au backend."
              : "Ajoutez une note si utile puis appliquez l'action a la session."}
          </DialogDescription>
        </DialogHeader>
        {config.confirm ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-700">
            Cette action peut modifier l&apos;etat de confirmation visible pour les operations et le client.
          </div>
        ) : null}
        <div className="space-y-2">
          <div className="text-sm font-medium">Note optionnelle</div>
          <Textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Ajouter un contexte interne..."
            className="min-h-[120px]"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={config.variant}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {config.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
