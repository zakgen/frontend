"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Loader2, PackagePlus, Search, Store, Trash2, Upload } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { BulkImportDialog } from "@/components/products/bulk-import-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { getBusinessHref } from "@/lib/routes";
import type { BulkProductInput, Product, ProductInput } from "@/lib/types";
import { formatCurrency, formatRelativeTime, getStockStatusLabel } from "@/lib/utils";
import type { ProductFormValues } from "@/lib/validators/product";

const api = getDashboardApi();

function toProductInput(product: Product, businessId: number): ProductInput {
  return {
    id: product.id,
    business_id: businessId,
    external_id: product.external_id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    currency: product.currency,
    stock_status: product.stock_status,
    variants: product.variants,
  };
}

export function ProductsManager({ businessId }: { businessId: number }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: queryKeys.products(businessId, `${search}:${category}`),
    queryFn: () => api.getProducts(businessId, search, category),
  });
  const integrationsQuery = useQuery({
    queryKey: queryKeys.integrations(businessId),
    queryFn: () => api.getIntegrations(businessId),
  });
  const syncQuery = useQuery({
    queryKey: queryKeys.syncStatus(businessId),
    queryFn: () => api.getSyncStatus(businessId),
  });

  const baseInvalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["products", businessId] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.overview(businessId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus(businessId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.integrations(businessId) });
  };

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      api.createProduct(businessId, { ...values, business_id: businessId }),
    onSuccess: () => {
      toast.success("Produit ajoute");
      setDialogOpen(false);
      baseInvalidate();
    },
    onError: () => toast.error("Impossible d'ajouter le produit"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, values }: { productId: string; values: ProductFormValues }) =>
      api.updateProduct(productId, { ...values, business_id: businessId }),
    onSuccess: () => {
      toast.success("Produit mis a jour");
      setDialogOpen(false);
      setEditingProduct(null);
      baseInvalidate();
    },
    onError: () => toast.error("Impossible de modifier le produit"),
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => api.deleteProduct(productId),
    onSuccess: () => {
      toast.success("Produit supprime");
      setDeleteCandidate(null);
      baseInvalidate();
    },
    onError: () => toast.error("Impossible de supprimer le produit"),
  });

  const bulkMutation = useMutation({
    mutationFn: (items: BulkProductInput[]) => api.bulkImportProducts(businessId, items),
    onSuccess: (products) => {
      toast.success(`${products.length} produits importes`);
      baseInvalidate();
    },
    onError: (error) =>
      toast.error("Import impossible", {
        description: error instanceof Error ? error.message : "Verifiez le format du fichier.",
      }),
  });
  const shopifyImportMutation = useMutation({
    mutationFn: () => api.importShopifyProducts(businessId),
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported_products} products from Shopify.`);
      baseInvalidate();
    },
    onError: (error) =>
      toast.error("Import Shopify impossible", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'importer les produits depuis Shopify.",
      }),
  });

  const products = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data?.products]);
  const categories = productsQuery.data?.categories ?? [];
  const shopifyIntegration =
    integrationsQuery.data?.platforms.find((platform) => platform.id === "shopify") ?? null;
  const hasShopifyContext = Boolean(shopifyIntegration);
  const shopifyConnected = shopifyIntegration?.status === "connected";
  const shopifyImportDisabledReason = !hasShopifyContext
    ? null
    : !shopifyConnected
      ? "Connect Shopify first to import products."
      : null;
  const summary = useMemo(
    () => ({
      total: productsQuery.data?.total ?? 0,
      inStock: products.filter((product) => product.stock_status === "in_stock").length,
      lowStock: products.filter((product) => product.stock_status === "low_stock").length,
    }),
    [products, productsQuery.data?.total],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Produits"
        title="Gardez un catalogue simple, propre et utile"
        description="Ajoutez vos produits, regroupez-les par categorie et preparez votre assistant a repondre sur le prix, le stock et les variantes."
        trailing={
          <div className="flex flex-wrap gap-3">
            {hasShopifyContext ? (
              <Button
                variant="outline"
                onClick={() => shopifyImportMutation.mutate()}
                disabled={shopifyImportMutation.isPending || Boolean(shopifyImportDisabledReason)}
                title={shopifyImportDisabledReason ?? undefined}
              >
                {shopifyImportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Store className="h-4 w-4" />
                )}
                {shopifyImportMutation.isPending ? "Importing..." : "Import from Shopify"}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Upload className="h-4 w-4" />
              Importer en masse
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setDialogOpen(true);
              }}
            >
              <PackagePlus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>
        }
      />

      {hasShopifyContext ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={shopifyConnected ? "success" : "secondary"}>
                  {shopifyConnected ? "Shopify connecte" : "Shopify non connecte"}
                </Badge>
                {shopifyIntegration?.shop_domain ? (
                  <span className="text-sm text-muted-foreground">
                    Shopify: {shopifyIntegration.shop_domain}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span>Imported products: {shopifyIntegration?.imported_products ?? 0}</span>
                <span>
                  Last import: {formatRelativeTime(shopifyIntegration?.last_product_import_at)}
                </span>
                {shopifyIntegration?.last_product_import_status ? (
                  <span>Status: {shopifyIntegration.last_product_import_status}</span>
                ) : null}
              </div>
              {shopifyImportDisabledReason ? (
                <p className="text-sm text-muted-foreground">{shopifyImportDisabledReason}</p>
              ) : null}
              {shopifyIntegration?.last_product_import_status === "failed" &&
              shopifyIntegration.last_product_import_error ? (
                <p className="text-sm text-destructive">
                  {shopifyIntegration.last_product_import_error}
                </p>
              ) : null}
            </div>
            {shopifyConnected ? (
              <Button
                variant="outline"
                onClick={() => shopifyImportMutation.mutate()}
                disabled={shopifyImportMutation.isPending}
              >
                {shopifyImportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Store className="h-4 w-4" />
                )}
                {shopifyImportMutation.isPending ? "Importing..." : "Import from Shopify"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {syncQuery.data && !syncQuery.data.ai_ready ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium text-amber-700">Votre assistant doit etre actualise</div>
              <p className="mt-1 text-sm text-muted-foreground">{syncQuery.data.last_result}</p>
            </div>
            <Button asChild>
              <Link href={getBusinessHref(businessId, "/rag")}>Mettre a jour l&apos;assistant</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Produits</div>
            <div className="mt-2 text-3xl font-semibold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">En stock</div>
            <div className="mt-2 text-3xl font-semibold">{summary.inStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Stock limite</div>
            <div className="mt-2 text-3xl font-semibold">{summary.lowStock}</div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Catalogue</CardTitle>
            <div className="text-sm text-muted-foreground">{summary.total} produits</div>
          </div>
          <div className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Rechercher un produit"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {productsQuery.isError ? (
            <ErrorState
              title="Catalogue indisponible"
              description="Le catalogue produits n'a pas pu etre charge."
              onRetry={() => productsQuery.refetch()}
            />
          ) : productsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="Aucun produit"
              description="Ajoutez vos produits pour que votre assistant puisse les recommander aux clientes."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Nom</th>
                    <th className="px-4 py-2 font-medium">Categorie</th>
                    <th className="px-4 py-2 font-medium">Prix</th>
                    <th className="px-4 py-2 font-medium">Stock</th>
                    <th className="px-4 py-2 font-medium">Modifie</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="rounded-2xl bg-background/70 shadow-sm">
                      <td className="rounded-l-2xl border-y border-l border-border px-4 py-4">
                        <div className="font-medium">{product.name}</div>
                        <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      </td>
                      <td className="border-y border-border px-4 py-4 text-sm text-muted-foreground">
                        {product.category}
                      </td>
                      <td className="border-y border-border px-4 py-4 text-sm font-medium">
                        {formatCurrency(product.price, product.currency)}
                      </td>
                      <td className="border-y border-border px-4 py-4">
                        <Badge
                          variant={
                            product.stock_status === "out_of_stock"
                              ? "destructive"
                              : product.stock_status === "low_stock"
                                ? "warning"
                                : "success"
                          }
                        >
                          {getStockStatusLabel(product.stock_status)}
                        </Badge>
                      </td>
                      <td className="border-y border-border px-4 py-4 text-sm text-muted-foreground">
                        {new Intl.DateTimeFormat("fr-MA", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(product.updated_at))}
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-border px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {deleteCandidate === product.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteCandidate(null)}
                              >
                                Annuler
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMutation.mutate(product.id)}
                                disabled={deleteMutation.isPending}
                              >
                                Supprimer ?
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setDialogOpen(true);
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteCandidate(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}
        initialProduct={editingProduct ? toProductInput(editingProduct, businessId) : null}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        categories={categories.length ? categories : ["Djellabas", "Sacs", "Ensembles", "Beaute"]}
        onSubmit={(values) => {
          if (editingProduct) {
            updateMutation.mutate({ productId: editingProduct.id, values });
            return;
          }

          createMutation.mutate(values);
        }}
      />

      <BulkImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        isSubmitting={bulkMutation.isPending}
        onSubmit={async (items) => {
          await bulkMutation.mutateAsync(items);
        }}
      />
    </div>
  );
}
