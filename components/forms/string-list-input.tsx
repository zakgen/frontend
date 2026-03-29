"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function StringListInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function addItem(raw: string) {
    const next = raw.trim();
    if (!next) return;
    if (value.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...value, next]);
    setDraft("");
  }

  return (
    <div className="rounded-2xl border border-input bg-background/80 p-3">
      <div className="mb-3 flex flex-wrap gap-2">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1 pl-3 pr-1.5">
            {item}
            <button
              type="button"
              className="rounded-full p-1 hover:bg-background"
              onClick={() => onChange(value.filter((entry) => entry !== item))}
              aria-label={`Retirer ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addItem(draft);
          }
        }}
        onBlur={() => addItem(draft)}
        placeholder={placeholder}
      />
    </div>
  );
}
