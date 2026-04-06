import { MessageCircleMore, Package2, Sparkles } from "lucide-react";

import { RasilLogo } from "@/components/brand/rasil-logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    icon: MessageCircleMore,
    title: "Conversations lisibles",
    description: "Retrouvez les demandes clients par numero, intention et priorite humaine.",
  },
  {
    icon: Package2,
    title: "Catalogue maitrise",
    description: "Gardez vos fiches produits nettes, a jour et utilisables par l'equipe.",
  },
  {
    icon: Sparkles,
    title: "Flux plus fiable",
    description: "Le profil boutique, les confirmations et la connaissance IA restent alignes.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 lg:px-8">
      <div className="absolute inset-0 surface-lines opacity-30" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_520px]">
        <section className="hidden rounded-[32px] border border-border/80 bg-card/88 p-8 shadow-panel backdrop-blur-md lg:flex lg:flex-col">
          <div className="max-w-[260px]">
            <RasilLogo variant="full" priority />
          </div>

          <div className="mt-12 space-y-5">
            <Badge className="w-fit">Acces prive</Badge>
            <h1 className="font-display text-5xl font-semibold leading-tight tracking-[-0.05em] text-balance">
              Clarifiez vos commandes et gardez la maitrise de vos operations.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Rasil rassemble les conversations, le catalogue, les confirmations et les details
              boutique dans un cockpit plus clair pour votre equipe.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="bg-background/70">
                  <CardContent className="flex gap-4 p-5">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{item.title}</div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-auto rounded-[28px] border border-primary/15 bg-primary/8 p-5">
            <div className="text-sm font-medium text-primary">Pret pour la suite</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Order Clarity &amp; Operational Control, avec une authentification privee geree par Supabase.
            </p>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full rounded-[32px] bg-card/94 shadow-panel">
            <CardHeader className="space-y-4 p-8 pb-6">
              <Badge className="w-fit">{eyebrow}</Badge>
              <div className="space-y-2">
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.04em]">
                  {title}
                </CardTitle>
                <CardDescription className="text-base leading-7">{description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">{children}</CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
