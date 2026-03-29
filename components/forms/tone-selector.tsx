"use client";

import type { ToneOfVoice } from "@/lib/types";
import { cn, getToneLabel } from "@/lib/utils";

const options: Array<{ value: ToneOfVoice; example: string }> = [
  {
    value: "formal",
    example: "Bonjour, nous vous remercions pour votre message.",
  },
  {
    value: "friendly",
    example: "Bonjour, avec plaisir. Je vous aide tout de suite.",
  },
  {
    value: "professional",
    example: "Bonjour, voici les informations essentielles concernant votre demande.",
  },
];

export function ToneSelector({
  value,
  onChange,
}: {
  value: ToneOfVoice;
  onChange: (value: ToneOfVoice) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-2xl border px-4 py-4 text-left transition",
            value === option.value
              ? "border-primary bg-primary/8"
              : "border-border bg-background/80 hover:bg-muted/60",
          )}
        >
          <div className="font-medium">{getToneLabel(option.value)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{option.example}</div>
        </button>
      ))}
    </div>
  );
}
