import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? <Badge variant="secondary" className="w-fit">{eyebrow}</Badge> : null}
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        </div>
      </div>
      {trailing}
    </div>
  );
}
