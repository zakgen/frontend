import { redirect } from "next/navigation";

import type { BusinessSummary, MyBusinessesResponse } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }
  return baseUrl.replace(/\/+$/, "");
}

function getAuthHeaders(user: { id: string; email?: string | null }) {
  return {
    "X-Auth-User-Id": user.id,
    ...(user.email ? { "X-Auth-User-Email": user.email } : {}),
  };
}

async function fetchWithAuth<T>(
  path: string,
  user: { id: string; email?: string | null },
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: getAuthHeaders(user),
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login?message=Votre session a expire. Reconnectez-vous.");
  }

  if (!response.ok) {
    let message = `Backend request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail ?? message;
    } catch {
      // ignore malformed bodies
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function requireAuthenticatedUser(next: string) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return user;
}

export async function getMyBusinessesForUser(
  next = "/businesses",
): Promise<{ user: Awaited<ReturnType<typeof requireAuthenticatedUser>>; account: MyBusinessesResponse }> {
  const user = await requireAuthenticatedUser(next);
  const account = await fetchWithAuth<MyBusinessesResponse>("/me/businesses", user);
  return { user, account };
}

export function pickCurrentBusinessId(account: MyBusinessesResponse) {
  return account.current_business_id ?? account.businesses[0]?.id ?? null;
}

export function findBusinessById(
  account: MyBusinessesResponse,
  businessId: number,
): BusinessSummary | null {
  return account.businesses.find((business) => business.id === businessId) ?? null;
}

export async function resolvePostLoginDestination() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return "/login";
  }

  const account = await fetchWithAuth<MyBusinessesResponse>("/me/businesses", user);

  if (account.businesses.length === 1) {
    return `/b/${account.businesses[0].id}`;
  }

  return "/businesses";
}

export async function resolveDashboardRedirect(section = "") {
  const { account } = await getMyBusinessesForUser(`/dashboard${section}`);

  if (account.businesses.length === 1) {
    return `/b/${account.businesses[0].id}${section}`;
  }

  return "/businesses";
}
