import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/10 bg-primary/10 text-primary",
        secondary: "border-border/70 bg-secondary/90 text-secondary-foreground",
        outline: "border-border bg-background/70 text-foreground",
        success: "border-emerald-500/15 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        warning: "border-amber-500/15 bg-amber-500/12 text-amber-700 dark:text-amber-300",
        destructive: "border-destructive/15 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
