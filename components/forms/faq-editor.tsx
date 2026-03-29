"use client";

import { Plus, Trash2 } from "lucide-react";

import type { FAQItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FAQEditor({
  value,
  onChange,
}: {
  value: FAQItem[];
  onChange: (next: FAQItem[]) => void;
}) {
  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-input bg-background/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">FAQ #{index + 1}</div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(value.filter((entry) => entry.id !== item.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              value={item.question}
              onChange={(event) =>
                onChange(
                  value.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, question: event.target.value }
                      : entry,
                  ),
                )
              }
              placeholder="Question"
            />
            <Textarea
              value={item.answer}
              onChange={(event) =>
                onChange(
                  value.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, answer: event.target.value }
                      : entry,
                  ),
                )
              }
              placeholder="Reponse"
              className="min-h-[96px]"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...value,
            {
              id: `faq-${Math.random().toString(36).slice(2, 8)}`,
              question: "",
              answer: "",
            },
          ])
        }
      >
        <Plus className="h-4 w-4" />
        Ajouter une FAQ
      </Button>
    </div>
  );
}
