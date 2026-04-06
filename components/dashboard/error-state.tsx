import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[20px] border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold tracking-[-0.03em]">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {onRetry ? <Button variant="outline" onClick={onRetry}>Reessayer</Button> : null}
      </CardContent>
    </Card>
  );
}
