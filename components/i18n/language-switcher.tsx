"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/messages";

const localeItems: Locale[] = ["fr", "en"];

export function LanguageSwitcher({
  className,
}: Readonly<{
  className?: string;
}>) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl border border-border/70 bg-background/75 p-1",
        className,
      )}
      aria-label={t("language.switcher")}
    >
      <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
        <Languages className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("language.switcher")}</span>
      </div>
      {localeItems.map((item) => (
        <Button
          key={item}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setLocale(item)}
          className={cn(
            "h-8 rounded-xl px-3 text-xs uppercase tracking-[0.16em]",
            locale === item
              ? "bg-primary text-primary-foreground hover:bg-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item}
        </Button>
      ))}
    </div>
  );
}
