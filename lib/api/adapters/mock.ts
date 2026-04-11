import { DashboardApi } from "@/lib/api/dashboard-api";
import {
  buildChecklist,
  buildConversationSummaries,
  buildIntegrationsData,
  getConversationThread,
  readDemoState,
  writeDemoState,
} from "@/lib/api/mock-store";
import type {
  BulkProductInput,
  BusinessProfile,
  BusinessSummary,
  ChatReplyInput,
  ChatFilters,
  CommercePlatformId,
  ConversationMessage,
  CreateBusinessInput,
  MyBusinessesResponse,
  OrderConfirmationIngestResponse,
  OrderConfirmationActionInput,
  OrderConfirmationRequest,
  OrderConfirmationSessionDetail,
  OrderConfirmationSessionListResponse,
  OrderConfirmationSessionStatus,
  Product,
  ProductInput,
  ShopifyProductImportResult,
  ProductVariant,
  SyncStatus,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toVariants(variants: BulkProductInput["variants"]): ProductVariant[] {
  return (variants ?? []).map((variant, index) => ({
    id: `var-${Math.random().toString(36).slice(2, 8)}-${index}`,
    name: variant,
    additional_price: null,
    stock_status: "in_stock",
  }));
}

function generateProduct(item: BulkProductInput, businessId: number): Product {
  const timestamp = new Date().toISOString();
  return {
    id: `prod-${Math.random().toString(36).slice(2, 10)}`,
    business_id: businessId,
    external_id: slugify(item.name),
    name: item.name,
    description: item.description ?? "",
    category: item.category ?? "Autres",
    price: item.price ?? null,
    currency: item.currency ?? "MAD",
    stock_status: item.stock_status ?? "in_stock",
    variants: toVariants(item.variants),
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function markKnowledgeStale(state: ReturnType<typeof readDemoState>, reason: string) {
  state.syncStatus.ai_ready = false;
  state.syncStatus.status = "recommended";
  state.syncStatus.last_result = reason;
  state.syncStatus.stale_reasons = [reason];
}

function matchesChatFilters(
  summary: ReturnType<typeof buildConversationSummaries>[number],
  filters?: ChatFilters,
) {
  if (!filters) return true;

  const phoneMatch = !filters.phone || summary.phone.includes(filters.phone);
  const intentMatch =
    !filters.intent || filters.intent === "all" || summary.intents.includes(filters.intent);
  const directionMatch =
    !filters.direction ||
    filters.direction === "all" ||
    (filters.direction === "inbound" ? summary.inbound_count > 0 : summary.outbound_count > 0);
  const humanMatch = !filters.needs_human || summary.needs_human;

  return phoneMatch && intentMatch && directionMatch && humanMatch;
}

function toBusinessSummary(business: BusinessProfile): BusinessSummary {
  return {
    id: business.id,
    name: business.name,
    description: business.summary,
    city: business.city,
    shipping_policy: business.shipping_policy,
    delivery_zones: business.delivery_zones,
    payment_methods: business.payment_methods,
    profile_metadata: {
      niche: business.niche,
      tone_of_voice: business.tone_of_voice,
    },
    updated_at: business.updated_at,
  };
}

export class MockDashboardApi implements DashboardApi {
  async getMyBusinesses(): Promise<MyBusinessesResponse> {
    await delay();
    const business = readDemoState().business;
    return {
      businesses: [toBusinessSummary(business)],
      current_business_id: business.id,
    };
  }

  async getMyBusiness(): Promise<BusinessSummary> {
    await delay();
    return toBusinessSummary(readDemoState().business);
  }

  async createMyBusiness(input: CreateBusinessInput): Promise<BusinessSummary> {
    await delay();
    const state = readDemoState();
    state.business = {
      ...state.business,
      id: Date.now(),
      name: input.name,
      summary: input.description ?? "",
      city: input.city ?? "",
      shipping_policy: input.shipping_policy ?? "",
      updated_at: new Date().toISOString(),
    };
    writeDemoState(state);
    return toBusinessSummary(state.business);
  }

  async getOverview(businessId: number) {
    await delay();
    const state = readDemoState();
    const summaries = buildConversationSummaries(state.messages);
    const checklist = buildChecklist(state);

    return {
      stats: {
        total_conversations: summaries.length,
        messages_handled: state.messages.length,
        active_products: state.products.length,
        ai_knowledge_status: state.syncStatus.ai_ready ? "A jour" : "Mise a jour recommandee",
      },
      recent_chats: summaries.slice(0, 6),
      recent_products: state.products
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 3),
      ai_insight: {
        title: "Suggestion IA",
        description:
          "3 clientes ont demande la livraison a Agadir cette semaine. Pensez a l'ajouter a vos zones de livraison.",
      },
      sync_notice: state.syncStatus.ai_ready
        ? null
        : "Votre assistant n'a pas encore appris vos derniers produits. Mettez-le a jour pour garder des reponses precises.",
      checklist,
    };
  }

  async getBusiness(businessId: number) {
    await delay();
    return readDemoState().business;
  }

  async updateBusiness(businessId: number, input: Partial<BusinessProfile>) {
    await delay();
    const state = readDemoState();
    state.business = {
      ...state.business,
      ...input,
      id: businessId,
      updated_at: new Date().toISOString(),
    };
    markKnowledgeStale(
      state,
      "Votre profil boutique a change. Mettez a jour l'assistant pour appliquer ces modifications.",
    );
    writeDemoState(state);
    return state.business;
  }

  async getChats(businessId: number, filters?: ChatFilters) {
    await delay();
    const summaries = buildConversationSummaries(readDemoState().messages);
    return summaries.filter((summary) => matchesChatFilters(summary, filters));
  }

  async getChatThread(businessId: number, phone: string) {
    await delay();
    return getConversationThread(readDemoState().messages, phone);
  }

  async sendChatReply(
    businessId: number,
    phone: string,
    input: ChatReplyInput,
  ): Promise<ConversationMessage> {
    await delay(260);
    const state = readDemoState();
    const latestMessage = state.messages
      .filter((item) => item.phone === phone)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    const message: ConversationMessage = {
      id: `msg-${Math.random().toString(36).slice(2, 10)}`,
      phone,
      text: input.text,
      direction: "outbound",
      timestamp: new Date().toISOString(),
      intent: input.intent ?? null,
      needs_human: input.needs_human ?? false,
      message_context: latestMessage?.message_context ?? "general",
      order_window_status: latestMessage?.order_window_status ?? null,
      order_session_id: latestMessage?.order_session_id ?? null,
      order_id: latestMessage?.order_id ?? null,
      order_external_id: latestMessage?.order_external_id ?? null,
    };
    state.messages.push(message);
    state.whatsapp.last_activity_at = message.timestamp;
    writeDemoState(state);
    return message;
  }

  async getProducts(businessId: number, search = "", category = "all") {
    await delay();
    const state = readDemoState();
    const products = state.products.filter((product) => {
      const keyword = search.trim().toLowerCase();
      const categoryMatch = category === "all" || !category || product.category === category;
      if (!categoryMatch) return false;
      if (!keyword) return true;
      return [product.name, product.description, product.category]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    const categories = Array.from(new Set(state.products.map((product) => product.category))).sort();

    return {
      products: products.sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
      total: products.length,
      categories,
    };
  }

  async importShopifyProducts(
    businessId: number,
  ): Promise<ShopifyProductImportResult> {
    throw new Error(
      "L'import Shopify necessite un backend reel. Configurez NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  async createProduct(businessId: number, input: ProductInput) {
    await delay();
    const state = readDemoState();
    const timestamp = new Date().toISOString();
    const product: Product = {
      ...input,
      id: `prod-${Math.random().toString(36).slice(2, 10)}`,
      external_id: input.external_id ?? slugify(input.name),
      created_at: timestamp,
      updated_at: timestamp,
    };
    state.products.unshift(product);
    markKnowledgeStale(
      state,
      "Un nouveau produit a ete ajoute. Mettez a jour l'assistant pour qu'il puisse le recommander.",
    );
    writeDemoState(state);
    return product;
  }

  async updateProduct(productId: string, input: ProductInput) {
    await delay();
    const state = readDemoState();
    const index = state.products.findIndex((product) => product.id === productId);
    if (index === -1) throw new Error("Produit introuvable");

    const updated: Product = {
      ...state.products[index],
      ...input,
      id: productId,
      updated_at: new Date().toISOString(),
    };
    state.products[index] = updated;
    markKnowledgeStale(
      state,
      "Votre catalogue a change. Mettez a jour l'assistant pour garder des reponses a jour.",
    );
    writeDemoState(state);
    return updated;
  }

  async deleteProduct(productId: string) {
    await delay();
    const state = readDemoState();
    state.products = state.products.filter((product) => product.id !== productId);
    markKnowledgeStale(
      state,
      "Un produit a ete supprime. Mettez a jour l'assistant pour actualiser ses connaissances.",
    );
    writeDemoState(state);
  }

  async bulkImportProducts(businessId: number, items: BulkProductInput[]) {
    await delay(320);
    const state = readDemoState();
    const created = items.map((item) => generateProduct(item, businessId));
    state.products = [...created, ...state.products];
    markKnowledgeStale(
      state,
      `${created.length} nouveaux produits ont ete importes. Mettez a jour l'assistant pour les rendre disponibles.`,
    );
    writeDemoState(state);
    return created;
  }

  async getSyncStatus(businessId: number) {
    await delay();
    return readDemoState().syncStatus;
  }

  async triggerSync(businessId: number) {
    await delay(700);
    const state = readDemoState();
    const syncStatus: SyncStatus = {
      ...state.syncStatus,
      business_id: businessId,
      status: "up_to_date",
      last_synced_at: new Date().toISOString(),
      last_result: "Votre assistant connait maintenant tous vos produits et informations boutique.",
      synced_products: state.products.length,
      synced_business_knowledge: 1,
      synced_faqs: state.business.faq.length,
      ai_ready: true,
      stale_reasons: [],
    };
    state.syncStatus = syncStatus;
    writeDemoState(state);
    return syncStatus;
  }

  async getIntegrations(businessId: number) {
    await delay();
    return buildIntegrationsData(readDemoState());
  }

  async getShopifyConnectAuthUrl(
    businessId: number,
    shop: string,
    returnTo: string,
  ): Promise<string> {
    throw new Error(
      "La connexion Shopify necessite un backend reel. Configurez NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  async setWhatsAppConnection(
    businessId: number,
    status: "connected" | "disconnected",
    options?: { phoneNumber?: string; businessName?: string },
  ) {
    await delay(260);
    const state = readDemoState();
    state.whatsapp.status = status;
    state.whatsapp.health = status === "connected" ? "healthy" : "attention";
    if (options?.phoneNumber) state.whatsapp.phone_number = options.phoneNumber;
    if (options?.businessName) state.whatsapp.business_name = options.businessName;
    writeDemoState(state);
    return buildIntegrationsData(state);
  }

  async runCommerceSync(businessId: number, platformId: CommercePlatformId) {
    await delay(400);
    const state = readDemoState();
    state.platforms = state.platforms.map((platform) =>
      platform.id === platformId
        ? {
            ...platform,
            status: "connected",
            imported_products:
              platform.id === "youcan" ? platform.imported_products : state.products.length,
            last_sync_at: new Date().toISOString(),
          }
        : platform,
    );
    writeDemoState(state);
    return buildIntegrationsData(state);
  }

  async sendWhatsAppTestMessage(businessId: number, prompt: string) {
    await delay(380);
    return `Exemple de reponse Rasil : Bonjour, oui nous livrons a Fes et le paiement a la livraison est disponible. Souhaitez-vous confirmer votre ville et le produit qui vous interesse ?`;
  }

  async createOrderConfirmation(
    businessId: number,
    input: OrderConfirmationRequest,
  ): Promise<OrderConfirmationIngestResponse> {
    throw new Error(
      "Le test de confirmation de commande necessite un backend reel. Configurez NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  async getOrderConfirmationSession(
    businessId: number,
    sessionId: string,
  ): Promise<OrderConfirmationSessionDetail> {
    throw new Error(
      "Le test de confirmation de commande necessite un backend reel. Configurez NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  async listOrderConfirmationSessions(
    businessId: number,
    status?: OrderConfirmationSessionStatus | "all",
  ): Promise<OrderConfirmationSessionListResponse> {
    throw new Error(
      "La vue Confirmations de commande necessite un backend reel. Configurez NEXT_PUBLIC_API_BASE_URL.",
    );
  }

  async applyOrderConfirmationAction(
    businessId: number,
    sessionId: string,
    input: OrderConfirmationActionInput,
  ): Promise<OrderConfirmationSessionDetail> {
    throw new Error(
      "La gestion des sessions de confirmation necessite un backend reel. Configurez NEXT_PUBLIC_API_BASE_URL.",
    );
  }
}
