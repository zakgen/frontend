import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import type { SetupChecklist } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SetupChecklistBanner({
  checklist,
  compact = false,
}: {
  checklist: SetupChecklist;
  compact?: boolean;
}) {
  return (
    <Card className="border-primary/15 bg-primary/5">
      <CardContent className={cn("space-y-4 p-5", compact && "p-4")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-primary">
              Configuration de ZakBot
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {checklist.completed_count} / {checklist.total} etapes completees
            </div>
          </div>
        </div>
        <div className={cn("grid gap-3", compact ? "md:grid-cols-3" : "md:grid-cols-3")}>
          {checklist.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border p-4",
                item.completed
                  ? "border-primary/15 bg-background/80"
                  : "border-amber-500/20 bg-amber-500/5",
              )}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className={cn(
                    "mt-0.5 h-5 w-5",
                    item.completed ? "text-primary" : "text-amber-600",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.detail}</div>
                  {!item.completed && item.action_href && item.action_label ? (
                    <Button asChild variant="ghost" className="mt-2 h-auto px-0 py-0 text-primary">
                      <Link href={item.action_href}>{item.action_label}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
