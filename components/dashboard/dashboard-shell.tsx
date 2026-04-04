"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CircleUserRound,
  Bot,
  BriefcaseBusiness,
  Cable,
  ClipboardCheck,
  LayoutDashboard,
  MessageCircleMore,
  Package2,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");
const api = getDashboardApi();

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/chats", label: "Chats", icon: MessageCircleMore },
  { href: "/dashboard/order-confirmations", label: "Order Confirmations", icon: ClipboardCheck },
  { href: "/dashboard/products", label: "Produits", icon: Package2 },
  { href: "/dashboard/business", label: "Profil de la boutique", icon: BriefcaseBusiness },
  { href: "/dashboard/rag", label: "Connaissance IA", icon: Sparkles, status: "knowledge" as const },
  { href: "/dashboard/integrations", label: "Integrations", icon: Cable, status: "integrations" as const },
];

export function DashboardShell({
  userEmail,
  children,
}: Readonly<{ userEmail: string | null; children: React.ReactNode }>) {
  const pathname = usePathname();
  const businessQuery = useQuery({
    queryKey: queryKeys.business(businessId),
    queryFn: () => api.getBusiness(businessId),
  });
  const syncQuery = useQuery({
    queryKey: queryKeys.syncStatus(businessId),
    queryFn: () => api.getSyncStatus(businessId),
  });
  const integrationsQuery = useQuery({
    queryKey: queryKeys.integrations(businessId),
    queryFn: () => api.getIntegrations(businessId),
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 gap-6 p-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:p-6">
        <aside className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-soft backdrop-blur-sm lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          <div className="absolute inset-0 surface-grid opacity-30" />
          <div className="relative flex h-full flex-col lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-xl font-semibold tracking-tight">ZakBot</div>
                <div className="text-sm text-muted-foreground">
                  {businessQuery.data?.name ?? "Assistant WhatsApp pour votre boutique"}
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-3xl border border-border/60 bg-background/70 p-4">
              <Badge className="mb-3 w-fit">Demo client</Badge>
              <p className="text-sm text-muted-foreground">
                Suivez vos conversations, votre catalogue et l&apos;etat de votre assistant au meme endroit.
              </p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.status === "knowledge" ? (
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          syncQuery.data?.ai_ready ? "bg-primary" : "bg-amber-500",
                        )}
                      />
                    ) : null}
                    {item.status === "integrations" ? (
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          integrationsQuery.data?.whatsapp.status === "connected"
                            ? "bg-primary"
                            : "bg-amber-500",
                        )}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-4">
              <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <CircleUserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">Session active</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {userEmail ?? "Utilisateur connecte"}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <SignOutButton />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/80 p-4">
                <div>
                  <div className="text-sm font-medium">Apparence</div>
                  <div className="text-xs text-muted-foreground">Mode clair prioritaire</div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </aside>

        <main className="rounded-[28px] border border-border/60 bg-background/70 p-5 shadow-soft backdrop-blur-sm lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
