export const queryKeys = {
  myBusinesses: () => ["my-businesses"] as const,
  myBusiness: () => ["my-business"] as const,
  overview: (businessId: number) => ["overview", businessId] as const,
  business: (businessId: number) => ["business", businessId] as const,
  chats: (businessId: number, filters: Record<string, string | undefined>) =>
    ["chats", businessId, filters] as const,
  thread: (businessId: number, phone: string | null) =>
    ["thread", businessId, phone] as const,
  products: (businessId: number, search: string) =>
    ["products", businessId, search] as const,
  syncStatus: (businessId: number) => ["sync-status", businessId] as const,
  integrations: (businessId: number) => ["integrations", businessId] as const,
  orderConfirmations: (
    businessId: number,
    status: string,
  ) => ["order-confirmations", businessId, status] as const,
  orderConfirmationSession: (businessId: number, sessionId: string | null) =>
    ["order-confirmation-session", businessId, sessionId] as const,
};
