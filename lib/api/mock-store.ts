import type {
  BusinessProfile,
  CommerceIntegration,
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
  IntegrationsData,
  Product,
  SetupChecklist,
  SyncStatus,
  WhatsAppIntegration,
  ConversationIntent,
} from "@/lib/types";

import {
  mockBusiness,
  mockComingSoon,
  mockMessages,
  mockPlatforms,
  mockProducts,
  mockSyncStatus,
  mockWhatsAppIntegration,
} from "@/lib/api/mock-data";

export type DemoState = {
  business: BusinessProfile;
  products: Product[];
  messages: ConversationMessage[];
  syncStatus: SyncStatus;
  whatsapp: WhatsAppIntegration;
  platforms: CommerceIntegration[];
};

const STORAGE_KEY = "zakbot-dashboard-demo-v2";

function getSeedState(): DemoState {
  return {
    business: structuredClone(mockBusiness),
    products: structuredClone(mockProducts),
    messages: structuredClone(mockMessages),
    syncStatus: structuredClone(mockSyncStatus),
    whatsapp: structuredClone(mockWhatsAppIntegration),
    platforms: structuredClone(mockPlatforms),
  };
}

export function readDemoState(): DemoState {
  if (typeof window === "undefined") return getSeedState();

  const cached = window.localStorage.getItem(STORAGE_KEY);
  if (!cached) {
    const seed = getSeedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(cached) as DemoState;
  } catch {
    const seed = getSeedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function writeDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function buildChecklist(state: DemoState): SetupChecklist {
  const items = [
    {
      id: "business" as const,
      label: "Profil boutique renseigne",
      completed: Boolean(state.business.summary && state.business.delivery_zones.length),
      detail: state.business.summary
        ? "Les informations de votre boutique sont pretes."
        : "Ajoutez les informations essentielles de votre boutique.",
      action_href: "/dashboard/business",
      action_label: "Completer",
    },
    {
      id: "products" as const,
      label: "Produits ajoutes",
      completed: state.products.length > 0,
      detail:
        state.products.length > 0
          ? `${state.products.length} produits disponibles`
          : "Ajoutez au moins un produit",
      action_href: "/dashboard/products",
      action_label: "Voir les produits",
    },
    {
      id: "whatsapp" as const,
      label: "WhatsApp connecte",
      completed: state.whatsapp.status === "connected",
      detail:
        state.whatsapp.status === "connected"
          ? "Le numero WhatsApp Business est connecte."
          : "Connexion WhatsApp requise",
      action_href: "/dashboard/integrations",
      action_label: "Connecter maintenant",
    },
  ];

  return {
    completed_count: items.filter((item) => item.completed).length,
    total: items.length,
    items,
  };
}

export function buildIntegrationsData(state: DemoState): IntegrationsData {
  return {
    checklist: buildChecklist(state),
    whatsapp: state.whatsapp,
    platforms: state.platforms.slice(),
    coming_soon: structuredClone(mockComingSoon),
  };
}

export function buildConversationSummaries(
  messages: ConversationMessage[],
): ConversationSummary[] {
  const grouped = messages.reduce<Map<string, ConversationMessage[]>>((acc, message) => {
    const bucket = acc.get(message.phone) ?? [];
    bucket.push(message);
    acc.set(message.phone, bucket);
    return acc;
  }, new Map());

  return Array.from(grouped.entries())
    .map(([phone, bucket]) => {
      const ordered = bucket.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const last = ordered[ordered.length - 1];
      const intents = Array.from(
        new Set(ordered.map((message) => message.intent).filter(Boolean)),
      ) as ConversationIntent[];

      return {
        phone,
        customer_name:
          phone === "+212600111111"
            ? "Lina A."
            : phone === "+212611222333"
              ? "Sara B."
              : "Meryem K.",
        last_message: last?.text ?? "",
        last_timestamp: last?.timestamp ?? new Date().toISOString(),
        unread_count: ordered.filter((message) => message.direction === "inbound").length > 1 ? 1 : 0,
        intents,
        needs_human: ordered.some((message) => message.needs_human),
        inbound_count: ordered.filter((message) => message.direction === "inbound").length,
        outbound_count: ordered.filter((message) => message.direction === "outbound").length,
      };
    })
    .sort((a, b) => b.last_timestamp.localeCompare(a.last_timestamp));
}

export function getConversationThread(
  messages: ConversationMessage[],
  phone: string,
): ConversationThread {
  const items = messages
    .filter((message) => message.phone === phone)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    phone,
    customer_name: buildConversationSummaries(messages).find((item) => item.phone === phone)?.customer_name,
    first_contact_at: items[0]?.timestamp ?? null,
    messages: items,
  };
}
