export type MessageDirection = "inbound" | "outbound";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type KnowledgeState = "up_to_date" | "recommended" | "running" | "error";
export type ToneOfVoice = "formal" | "friendly" | "professional";
export type ConversationIntent =
  | "livraison"
  | "prix"
  | "disponibilite"
  | "retour"
  | "paiement"
  | "infos_produit"
  | "autre";
export type PaymentMethod =
  | "cash_on_delivery"
  | "card_payment"
  | "bank_transfer";
export type IntegrationConnectionState = "connected" | "disconnected";
export type IntegrationHealth = "healthy" | "attention";
export type CommercePlatformId = "youcan" | "shopify" | "woocommerce" | "zid";
export type PreferredLanguage = "english" | "french" | "darija";
export type OrderConfirmationSessionStatus =
  | "pending_send"
  | "awaiting_customer"
  | "confirmed"
  | "declined"
  | "edit_requested"
  | "human_requested"
  | "expired";
export type OrderConfirmationAction =
  | "confirm"
  | "decline"
  | "request_edit"
  | "request_human"
  | "reopen"
  | "resend";

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export type BusinessProfile = {
  id: number;
  name: string;
  summary: string;
  niche: string;
  city: string;
  supported_languages: string[];
  tone_of_voice: ToneOfVoice;
  opening_hours: string[];
  delivery_zones: string[];
  delivery_time: string;
  shipping_policy: string;
  return_policy: string;
  payment_methods: PaymentMethod[];
  faq: FAQItem[];
  order_rules: string[];
  escalation_contact: string;
  upsell_rules: string[];
  updated_at: string;
};

export type BusinessSummary = {
  id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  shipping_policy?: string | null;
  delivery_zones: string[];
  payment_methods: string[];
  profile_metadata: Record<string, unknown>;
  updated_at?: string | null;
};

export type MyBusinessesResponse = {
  businesses: BusinessSummary[];
  current_business_id: number | null;
};

export type CreateBusinessInput = {
  name: string;
  description?: string;
  city?: string;
  shipping_policy?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  additional_price: number | null;
  stock_status: StockStatus;
};

export type Product = {
  id: string;
  business_id: number;
  external_id?: string;
  name: string;
  description: string;
  category: string;
  price: number | null;
  currency: string;
  stock_status: StockStatus;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
};

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type BulkProductInput = {
  name: string;
  description?: string;
  category?: string;
  price?: number | null;
  currency?: string;
  stock_status?: StockStatus;
  variants?: string[];
};

export type ConversationMessage = {
  id: string;
  phone: string;
  text: string;
  direction: MessageDirection;
  timestamp: string;
  intent?: ConversationIntent | null;
  needs_human?: boolean;
};

export type ConversationSummary = {
  phone: string;
  customer_name?: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
  intents: ConversationIntent[];
  needs_human: boolean;
  inbound_count: number;
  outbound_count: number;
};

export type ConversationThread = {
  phone: string;
  customer_name?: string;
  first_contact_at: string | null;
  messages: ConversationMessage[];
};

export type ChatFilters = {
  phone?: string;
  intent?: ConversationIntent | "all";
  direction?: MessageDirection | "all";
  needs_human?: boolean;
};

export type ChatReplyInput = {
  text: string;
  intent?: ConversationIntent | null;
  needs_human?: boolean | null;
};

export type OverviewStats = {
  total_conversations: number;
  messages_handled: number;
  active_products: number;
  ai_knowledge_status: string;
};

export type SetupChecklistItem = {
  id: "business" | "products" | "whatsapp";
  label: string;
  completed: boolean;
  detail: string;
  action_href?: string;
  action_label?: string;
};

export type SetupChecklist = {
  completed_count: number;
  total: number;
  items: SetupChecklistItem[];
};

export type AIInsight = {
  title: string;
  description: string;
};

export type OverviewData = {
  stats: OverviewStats;
  recent_chats: ConversationSummary[];
  recent_products: Product[];
  ai_insight: AIInsight;
  sync_notice: string | null;
  checklist: SetupChecklist;
};

export type SyncStatus = {
  business_id: number;
  status: KnowledgeState;
  last_synced_at: string | null;
  last_result: string | null;
  synced_products: number;
  synced_business_knowledge: number;
  synced_faqs: number;
  embedding_model: string;
  ai_ready: boolean;
  stale_reasons: string[];
};

export type WhatsAppIntegration = {
  phone_number: string;
  business_name: string;
  status: IntegrationConnectionState;
  health: IntegrationHealth;
  received_messages_last_30_days: number;
  last_activity_at: string | null;
};

export type CommerceIntegration = {
  id: CommercePlatformId;
  name: string;
  description: string;
  status: IntegrationConnectionState;
  imported_products: number;
  last_sync_at: string | null;
  shop_domain?: string | null;
  last_activity_at?: string | null;
  last_sync_back_at?: string | null;
  webhook_status?: string | null;
};

export type ComingSoonIntegration = {
  id: string;
  name: string;
  description: string;
};

export type IntegrationsData = {
  checklist: SetupChecklist;
  whatsapp: WhatsAppIntegration;
  platforms: CommerceIntegration[];
  coming_soon: ComingSoonIntegration[];
};

export type ProductListResult = {
  products: Product[];
  total: number;
  categories: string[];
};

export type StoreOrderItemInput = {
  product_name: string;
  quantity: number;
  variant?: string | null;
  unit_price?: number | null;
  sku?: string | null;
};

export type OrderConfirmationRequest = {
  source_store: "generic" | "shopify" | "woocommerce" | "youcan" | "zid";
  external_order_id: string;
  customer_name?: string | null;
  customer_phone: string;
  preferred_language?: PreferredLanguage | null;
  total_amount: number;
  currency: string;
  payment_method?: string | null;
  delivery_city?: string | null;
  delivery_address?: string | null;
  order_notes?: string | null;
  items: StoreOrderItemInput[];
  metadata?: Record<string, unknown>;
  raw_payload?: Record<string, unknown>;
  send_confirmation?: boolean;
};

export type OrderRecord = {
  id: string;
  business_id: number;
  source_store: "generic" | "shopify" | "woocommerce" | "youcan" | "zid" | string;
  external_order_id: string;
  customer_name?: string | null;
  customer_phone: string;
  preferred_language?: string | null;
  total_amount: number;
  currency: string;
  payment_method?: string | null;
  delivery_city?: string | null;
  delivery_address?: string | null;
  order_notes?: string | null;
  status: string;
  confirmation_status: string;
  items: StoreOrderItemInput[];
  metadata: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
};

export type OrderConfirmationEvent = {
  id: string;
  session_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at?: string | null;
};

export type OrderConfirmationSessionSummary = {
  id: string;
  order_id: string;
  business_id: number;
  phone: string;
  customer_name?: string | null;
  preferred_language?: string | null;
  status: OrderConfirmationSessionStatus;
  needs_human: boolean;
  last_detected_intent?: string | null;
  started_at?: string | null;
  last_customer_message_at?: string | null;
  confirmed_at?: string | null;
  declined_at?: string | null;
  updated_at?: string | null;
};

export type OrderConfirmationSessionDetail = OrderConfirmationSessionSummary & {
  structured_snapshot: Record<string, unknown>;
  order: OrderRecord;
  events: OrderConfirmationEvent[];
};

export type OrderConfirmationIngestResponse = {
  order: OrderRecord;
  session: OrderConfirmationSessionDetail;
  confirmation_message_sent: boolean;
};

export type OrderConfirmationSessionListResponse = {
  sessions: OrderConfirmationSessionSummary[];
  total: number;
};

export type OrderConfirmationActionInput = {
  action: OrderConfirmationAction;
  note?: string | null;
};
