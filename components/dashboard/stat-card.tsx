import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden bg-card/95">
      <CardContent className="relative p-6">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
            <div className="rounded-[18px] border border-border/70 bg-background/85 p-3 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">{icon}</div>
          </div>
          <div className="space-y-1">
            <div className="font-display text-3xl font-semibold tracking-[-0.04em]">{value}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              {detail}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
