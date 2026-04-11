"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  CircleUserRound,
  BriefcaseBusiness,
  Cable,
  ClipboardCheck,
  LayoutDashboard,
  MessageCircleMore,
  Package2,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RasilLogo } from "@/components/brand/rasil-logo";
import { useBusinessContext } from "@/components/providers/business-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import { getBusinessHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const api = getDashboardApi();

export function DashboardShell({
  userEmail,
  businessId,
  children,
}: Readonly<{
  userEmail: string | null;
  businessId: number;
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { businesses, currentBusiness } = useBusinessContext();
  const { t } = useLocale();
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
  const navItems = [
    { href: getBusinessHref(businessId), label: t("dashboard.nav.overview"), icon: LayoutDashboard },
    { href: getBusinessHref(businessId, "/chats"), label: t("dashboard.nav.chats"), icon: MessageCircleMore },
    {
      href: getBusinessHref(businessId, "/order-confirmations"),
      label: t("dashboard.nav.orderConfirmations"),
      icon: ClipboardCheck,
    },
    { href: getBusinessHref(businessId, "/products"), label: t("dashboard.nav.products"), icon: Package2 },
    {
      href: getBusinessHref(businessId, "/business"),
      label: t("dashboard.nav.business"),
      icon: BriefcaseBusiness,
    },
    {
      href: getBusinessHref(businessId, "/rag"),
      label: t("dashboard.nav.knowledge"),
      icon: Sparkles,
      status: "knowledge" as const,
    },
    {
      href: getBusinessHref(businessId, "/integrations"),
      label: t("dashboard.nav.integrations"),
      icon: Cable,
      status: "integrations" as const,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1640px] grid-cols-1 gap-6 p-4 lg:grid-cols-[292px_minmax(0,1fr)] lg:items-start lg:p-6">
        <aside className="relative overflow-hidden rounded-[30px] border border-border/80 bg-card/94 p-5 shadow-panel backdrop-blur-md lg:sticky lg:top-6 lg:min-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-3rem)]">
          <div className="absolute inset-0 surface-lines opacity-40" />
          <div className="relative flex h-full min-h-[calc(100vh-8rem)] flex-col lg:max-h-[calc(100vh-5.5rem)] lg:min-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1">
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 rounded-[22px] border border-border/70 bg-background/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <RasilLogo variant="icon" className="w-full" priority />
                </div>
                <div>
                  <div className="font-display text-2xl font-semibold tracking-[-0.05em]">Rasil</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("dashboard.operationsCockpit")}
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-background/82 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("dashboard.activeStore")}
                </div>
                <div className="mt-2 text-base font-semibold text-foreground">
                  {currentBusiness?.name ?? businessQuery.data?.name ?? "Rasil"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Order Clarity &amp; Operational Control
                </div>
                {businesses.length > 1 ? (
                  <Button asChild variant="ghost" className="mt-3 h-auto px-0 text-primary">
                    <Link href="/businesses">
                      <ArrowLeftRight className="h-4 w-4" />
                      {t("dashboard.switchBusiness")}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <nav className="flex-1 space-y-1 pb-8">
              <div className="mb-4 rounded-2xl border border-border/60 bg-background/75 px-4 py-3 text-xs leading-5 text-muted-foreground">
                <span className="font-medium text-foreground">Chats</span> cover inbound WhatsApp conversations and assistant replies.
                <br />
                <span className="font-medium text-foreground">Order Confirmations</span> manage automated post-order confirmation flows.
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === getBusinessHref(businessId)
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
                        : "text-muted-foreground hover:bg-secondary/90 hover:text-foreground",
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

            <div className="space-y-4 border-t border-border/50 pt-6">
              <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <CircleUserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{t("dashboard.activeSession")}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {userEmail ?? t("dashboard.connectedUser")}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <SignOutButton />
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                <div className="mb-4">
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t("dashboard.appearance")}</div>
                    <div className="text-xs text-muted-foreground">{t("dashboard.lightThemeFirst")}</div>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="rounded-[30px] border border-border/75 bg-background/76 p-5 shadow-soft backdrop-blur-md lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
