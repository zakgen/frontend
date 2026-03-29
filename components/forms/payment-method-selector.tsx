"use client";

import type { PaymentMethod } from "@/lib/types";
import { cn, getPaymentMethodLabel } from "@/lib/utils";

const options: PaymentMethod[] = ["cash_on_delivery", "card_payment", "bank_transfer"];

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod[];
  onChange: (next: PaymentMethod[]) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() =>
              onChange(
                active ? value.filter((item) => item !== option) : [...value, option],
              )
            }
            className={cn(
              "rounded-2xl border px-4 py-3 text-left text-sm transition",
              active
                ? "border-primary bg-primary/8 text-foreground"
                : "border-border bg-background/80 hover:bg-muted/60",
            )}
          >
            <div className="font-medium">{getPaymentMethodLabel(option)}</div>
          </button>
        );
      })}
    </div>
  );
}
