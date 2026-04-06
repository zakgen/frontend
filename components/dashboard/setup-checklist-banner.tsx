import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { SetupChecklist } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mapDashboardHrefToBusiness } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SetupChecklistBanner({
  checklist,
  businessId,
  compact = false,
}: {
  checklist: SetupChecklist;
  businessId?: number;
  compact?: boolean;
}) {
  const { t } = useLocale();

  return (
    <Card className="border-primary/15 bg-primary/5">
      <CardContent className={cn("space-y-4 p-5", compact && "p-4")}>
        <div className="text-sm text-muted-foreground">
          {t("dashboard.setup.progress", {
            completed: checklist.completed_count,
            total: checklist.total,
          })}
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
                      <Link
                        href={
                          businessId
                            ? mapDashboardHrefToBusiness(item.action_href, businessId)
                            : item.action_href
                        }
                      >
                        {item.action_label}
                      </Link>
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
