import type {
  BusinessProfile,
  BulkProductInput,
  ChatFilters,
  ConversationSummary,
  ConversationThread,
  IntegrationsData,
  OverviewData,
  Product,
  ProductInput,
  ProductListResult,
  SyncStatus,
  CommercePlatformId,
} from "@/lib/types";

export interface DashboardApi {
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
  setWhatsAppConnection(
    businessId: number,
    status: "connected" | "disconnected",
  ): Promise<IntegrationsData>;
  runCommerceSync(
    businessId: number,
    platformId: CommercePlatformId,
  ): Promise<IntegrationsData>;
  sendWhatsAppTestMessage(
    businessId: number,
    prompt: string,
  ): Promise<string>;
}
