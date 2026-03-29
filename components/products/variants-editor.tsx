"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ProductVariant, StockStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function makeVariant(): ProductVariant {
  return {
    id: `variant-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    additional_price: null,
    stock_status: "in_stock",
  };
}

export function VariantsEditor({
  value,
  onChange,
}: {
  value: ProductVariant[];
  onChange: (next: ProductVariant[]) => void;
}) {
  function updateVariant(variantId: string, next: Partial<ProductVariant>) {
    onChange(value.map((variant) => (variant.id === variantId ? { ...variant, ...next } : variant)));
  }

  return (
    <div className="space-y-3">
      {value.map((variant) => (
        <div key={variant.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 md:grid-cols-[1.6fr_1fr_1fr_auto]">
          <Input
            value={variant.name}
            onChange={(event) => updateVariant(variant.id, { name: event.target.value })}
            placeholder="Nom de la variante"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={variant.additional_price ?? ""}
            onChange={(event) =>
              updateVariant(variant.id, {
                additional_price:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
            placeholder="Supplement"
          />
          <Select
            value={variant.stock_status}
            onValueChange={(next) =>
              updateVariant(variant.id, { stock_status: next as StockStatus })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">En stock</SelectItem>
              <SelectItem value="low_stock">Stock limite</SelectItem>
              <SelectItem value="out_of_stock">Rupture</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(value.filter((item) => item.id !== variant.id))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => onChange([...value, makeVariant()])}>
        <Plus className="h-4 w-4" />
        Ajouter une variante
      </Button>
    </div>
  );
}
