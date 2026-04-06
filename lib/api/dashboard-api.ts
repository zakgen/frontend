import type {
  BusinessProfile,
  BusinessSummary,
  BulkProductInput,
  ChatReplyInput,
  ChatFilters,
  ConversationSummary,
  ConversationThread,
  CreateBusinessInput,
  IntegrationsData,
  MyBusinessesResponse,
  OrderConfirmationActionInput,
  OrderConfirmationIngestResponse,
  OrderConfirmationRequest,
  OrderConfirmationSessionDetail,
  OrderConfirmationSessionListResponse,
  OrderConfirmationSessionStatus,
  OverviewData,
  Product,
  ProductInput,
  ProductListResult,
  SyncStatus,
  CommercePlatformId,
} from "@/lib/types";

export interface DashboardApi {
  getMyBusinesses(): Promise<MyBusinessesResponse>;
  getMyBusiness(): Promise<BusinessSummary>;
  createMyBusiness(input: CreateBusinessInput): Promise<BusinessSummary>;
  getOverview(businessId: number): Promise<OverviewData>;
  getBusiness(businessId: number): Promise<BusinessProfile>;
  updateBusiness(
    businessId: number,
    input: Partial<BusinessProfile>,
  ): Promise<BusinessProfile>;
  getChats(
    businessId: number,
    filters?: ChatFilters,
  ): Promise<ConversationSummary[]>;
  getChatThread(businessId: number, phone: string): Promise<ConversationThread>;
  sendChatReply(
    businessId: number,
    phone: string,
    input: ChatReplyInput,
  ): Promise<import("@/lib/types").ConversationMessage>;
  getProducts(
    businessId: number,
    search?: string,
    category?: string,
  ): Promise<ProductListResult>;
  createProduct(businessId: number, input: ProductInput): Promise<Product>;
  updateProduct(productId: string, input: ProductInput): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
  bulkImportProducts(
    businessId: number,
    items: BulkProductInput[],
  ): Promise<Product[]>;
  getSyncStatus(businessId: number): Promise<SyncStatus>;
  triggerSync(businessId: number): Promise<SyncStatus>;
  getIntegrations(businessId: number): Promise<IntegrationsData>;
  getShopifyConnectUrl(
    businessId: number,
    shop: string,
    returnTo: string,
  ): string;
  setWhatsAppConnection(
    businessId: number,
    status: "connected" | "disconnected",
    options?: { phoneNumber?: string; businessName?: string },
  ): Promise<IntegrationsData>;
  runCommerceSync(
    businessId: number,
    platformId: CommercePlatformId,
  ): Promise<IntegrationsData>;
  sendWhatsAppTestMessage(
    businessId: number,
    prompt: string,
  ): Promise<string>;
  createOrderConfirmation(
    businessId: number,
    input: OrderConfirmationRequest,
  ): Promise<OrderConfirmationIngestResponse>;
  getOrderConfirmationSession(
    businessId: number,
    sessionId: string,
  ): Promise<OrderConfirmationSessionDetail>;
  listOrderConfirmationSessions(
    businessId: number,
    status?: OrderConfirmationSessionStatus | "all",
  ): Promise<OrderConfirmationSessionListResponse>;
  applyOrderConfirmationAction(
    businessId: number,
    sessionId: string,
    input: OrderConfirmationActionInput,
  ): Promise<OrderConfirmationSessionDetail>;
}
