"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";

import { FormField } from "@/components/forms/form-field";
import { VariantsEditor } from "@/components/products/variants-editor";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProductInput } from "@/lib/types";
import { productSchema, type ProductFormValues } from "@/lib/validators/product";

const defaults: ProductFormValues = {
  name: "",
  description: "",
  category: "",
  price: null,
  currency: "MAD",
  stock_status: "in_stock",
  variants: [],
};

export function ProductFormDialog({
  open,
  onOpenChange,
  initialProduct,
  onSubmit,
  isSubmitting,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: ProductInput | null;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  categories: string[];
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(
      initialProduct
        ? {
            name: initialProduct.name,
            description: initialProduct.description,
            category: initialProduct.category,
            price: initialProduct.price,
            currency: initialProduct.currency,
            stock_status: initialProduct.stock_status,
            variants: initialProduct.variants,
          }
        : defaults,
    );
  }, [form, initialProduct, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{initialProduct ? "Modifier le produit" : "Ajouter un produit"}</SheetTitle>
          <SheetDescription>
            Gardez des fiches produits claires pour aider ZakBot a bien repondre sur les prix, les tailles et la disponibilite.
          </SheetDescription>
        </SheetHeader>
        <form className="flex h-full flex-col" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <FormField label="Nom du produit" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </FormField>
            <FormField label="Description" error={form.formState.errors.description?.message}>
              <Textarea {...form.register("description")} className="min-h-[120px]" />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <FormField label="Categorie" error={fieldState.error?.message}>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        {!categories.includes(field.value) && field.value ? (
                          <SelectItem value={field.value}>{field.value}</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
              <FormField label="Devise" error={form.formState.errors.currency?.message}>
                <Input {...form.register("currency")} />
              </FormField>
              <Controller
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <FormField label="Prix" error={fieldState.error?.message}>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value === "" ? null : Number(event.target.value))
                      }
                    />
                  </FormField>
                )}
              />
              <Controller
                control={form.control}
                name="stock_status"
                render={({ field, fieldState }) => (
                  <FormField label="Statut du stock" error={fieldState.error?.message}>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_stock">En stock</SelectItem>
                        <SelectItem value="low_stock">Stock limite</SelectItem>
                        <SelectItem value="out_of_stock">Rupture</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="variants"
              render={({ field, fieldState }) => (
                <FormField
                  label="Variantes"
                  description="Ajoutez vos tailles, couleurs ou formats avec leur stock."
                  error={fieldState.error?.message}
                >
                  <VariantsEditor value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />
          </div>
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {initialProduct ? "Enregistrer" : "Ajouter"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
