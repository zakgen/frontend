import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type {
  ConversationIntent,
  KnowledgeState,
  PaymentMethod,
  StockStatus,
  ToneOfVoice,
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, currency = "MAD") {
  if (value == null) return "Prix sur demande";

  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Aucune date";

  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "Aucune activite";

  const deltaMs = new Date(value).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const minutes = Math.round(deltaMs / 60_000);

  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");

  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}

export function maskPhoneNumber(value: string) {
  const compact = value.replace(/\s+/g, "");
  if (compact.length < 6) return value;

  return `${compact.slice(0, 5)} XX XXX ${compact.slice(-3)}`;
}

export function getDateGroupLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays <= 7) return "Cette semaine";
  return "Plus ancien";
}

export function getIntentMeta(intent: ConversationIntent) {
  const mapping: Record<
    ConversationIntent,
    { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }
  > = {
    livraison: { label: "Livraison", variant: "outline" },
    prix: { label: "Prix", variant: "secondary" },
    disponibilite: { label: "Disponibilite", variant: "success" },
    retour: { label: "Retour", variant: "warning" },
    paiement: { label: "Paiement", variant: "default" },
    infos_produit: { label: "Infos produit", variant: "secondary" },
    autre: { label: "Autre", variant: "outline" },
  };

  return mapping[intent];
}

export function getStockStatusLabel(status: StockStatus) {
  const mapping: Record<StockStatus, string> = {
    in_stock: "En stock",
    low_stock: "Stock limite",
    out_of_stock: "Rupture",
  };

  return mapping[status];
}

export function getToneLabel(tone: ToneOfVoice) {
  const mapping: Record<ToneOfVoice, string> = {
    formal: "Formel",
    friendly: "Amical",
    professional: "Professionnel",
  };

  return mapping[tone];
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod) {
  const mapping: Record<PaymentMethod, string> = {
    cash_on_delivery: "Paiement a la livraison",
    card_payment: "Carte bancaire",
    bank_transfer: "Virement bancaire",
  };

  return mapping[paymentMethod];
}

export function getKnowledgeStateLabel(state: KnowledgeState) {
  const mapping: Record<KnowledgeState, string> = {
    up_to_date: "Votre assistant est a jour",
    recommended: "Mise a jour recommandee",
    running: "Mise a jour en cours",
    error: "Mise a jour impossible",
  };

  return mapping[state];
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
