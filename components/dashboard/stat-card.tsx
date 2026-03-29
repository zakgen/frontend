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
    <Card className="overflow-hidden">
      <CardContent className="relative p-6">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="rounded-2xl bg-muted p-3 text-primary">{icon}</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-semibold tracking-tight">{value}</div>
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
