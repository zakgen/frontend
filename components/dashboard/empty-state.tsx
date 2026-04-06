import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed bg-card/88">
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[20px] border border-border/70 bg-background/80 p-4 text-muted-foreground">
          {icon ?? <Inbox className="h-8 w-8" />}
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold tracking-[-0.03em]">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
