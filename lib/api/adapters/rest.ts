import type { DashboardApi } from "@/lib/api/dashboard-api";
import type {
  BulkProductInput,
  BusinessProfile,
  ChatFilters,
  CommercePlatformId,
  IntegrationsData,
  OverviewData,
  Product,
  ProductInput,
  ProductListResult,
  SyncStatus,
} from "@/lib/types";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }
  return baseUrl.replace(/\/+$/, "");
}

function buildQuery(query?: RequestOptions["query"]) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}${buildQuery(options.query)}`, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string; errors?: Array<{ msg?: string }> };
      message = payload.detail ?? payload.errors?.[0]?.msg ?? message;
    } catch {
      // ignore malformed error bodies
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toVariantNameArray(product: ProductInput | BulkProductInput) {
  return (product.variants ?? []).map((variant) =>
    typeof variant === "string" ? variant : variant.name,
  );
}

export class RestDashboardApi implements DashboardApi {
  async getOverview(businessId: number): Promise<OverviewData> {
    return request<OverviewData>(`/business/${businessId}/overview`);
  }

  async getBusiness(businessId: number): Promise<BusinessProfile> {
    return request<BusinessProfile>(`/business/${businessId}`);
  }

  async updateBusiness(
    businessId: number,
    input: Partial<BusinessProfile>,
  ): Promise<BusinessProfile> {
    return request<BusinessProfile>(`/business/${businessId}`, {
      method: "PUT",
      body: input,
    });
  }

  async getChats(
    businessId: number,
    filters?: ChatFilters,
  ): Promise<import("@/lib/types").ConversationSummary[]> {
    return request(`/business/${businessId}/chats`, {
      query: {
        phone: filters?.phone,
        intent: filters?.intent && filters.intent !== "all" ? filters.intent : undefined,
        direction:
          filters?.direction && filters.direction !== "all" ? filters.direction : undefined,
        needs_human: filters?.needs_human ? true : undefined,
      },
    });
  }

  async getChatThread(
    businessId: number,
    phone: string,
  ): Promise<import("@/lib/types").ConversationThread> {
    return request(`/business/${businessId}/chats/${encodeURIComponent(phone)}`);
  }

  async getProducts(
    businessId: number,
    search?: string,
    category?: string,
  ): Promise<ProductListResult> {
    return request<ProductListResult>(`/business/${businessId}/products`, {
      query: {
        search: search?.trim() || undefined,
        category: category && category !== "all" ? category : undefined,
      },
    });
  }

  async createProduct(businessId: number, input: ProductInput): Promise<Product> {
    return request<Product>("/products", {
      method: "POST",
      body: {
        business_id: businessId,
        external_id: input.external_id,
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        currency: input.currency,
        stock_status: input.stock_status,
        variants: input.variants ?? [],
      },
    });
  }

  async updateProduct(productId: string, input: ProductInput): Promise<Product> {
    return request<Product>(`/products/${productId}`, {
      method: "PUT",
      body: {
        external_id: input.external_id,
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        currency: input.currency,
        stock_status: input.stock_status,
        variants: input.variants ?? [],
      },
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    await request(`/products/${productId}`, { method: "DELETE" });
  }

  async bulkImportProducts(
    businessId: number,
    items: BulkProductInput[],
  ): Promise<Product[]> {
    const response = await request<ProductListResult>("/products/bulk", {
      method: "POST",
      body: {
        business_id: businessId,
        products: items.map((item) => ({
          external_id: "name" in item && item.name ? item.name.toLowerCase().replace(/\s+/g, "-") : undefined,
          name: item.name,
          description: item.description ?? "",
          category: item.category ?? "",
          price: item.price ?? null,
          currency: item.currency ?? "MAD",
          stock_status: item.stock_status ?? "in_stock",
          variants: toVariantNameArray(item).map((name, index) => ({
            id: `bulk-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
            name,
            additional_price: null,
            stock_status: item.stock_status ?? "in_stock",
          })),
        })),
      },
    });
    return response.products;
  }

  async getSyncStatus(businessId: number): Promise<SyncStatus> {
    return request<SyncStatus>(`/embeddings/sync/business/${businessId}/status`);
  }

  async triggerSync(businessId: number): Promise<SyncStatus> {
    await request(`/embeddings/sync/business/${businessId}`, { method: "POST" });
    return this.getSyncStatus(businessId);
  }

  async getIntegrations(businessId: number): Promise<IntegrationsData> {
    return request<IntegrationsData>(`/business/${businessId}/integrations`);
  }

  async setWhatsAppConnection(
    businessId: number,
    status: "connected" | "disconnected",
    options?: { phoneNumber?: string; businessName?: string },
  ): Promise<IntegrationsData> {
    if (status === "connected") {
      await request(`/business/${businessId}/integrations/whatsapp/connect`, {
        method: "POST",
        body: {
          phone_number: options?.phoneNumber,
          business_name: options?.businessName,
        },
      });
    } else {
      await request(`/business/${businessId}/integrations/whatsapp/disconnect`, {
        method: "POST",
      });
    }
    return this.getIntegrations(businessId);
  }

  async runCommerceSync(
    businessId: number,
    platformId: CommercePlatformId,
  ): Promise<IntegrationsData> {
    await request(`/business/${businessId}/integrations/platforms/${platformId}/sync`, {
      method: "POST",
    });
    return this.getIntegrations(businessId);
  }

  async sendWhatsAppTestMessage(
    businessId: number,
    prompt: string,
  ): Promise<string> {
    const response = await request<{ message: string }>(
      `/business/${businessId}/integrations/whatsapp/test`,
      {
        method: "POST",
        body: { message: prompt },
      },
    );
    return response.message;
  }
}
