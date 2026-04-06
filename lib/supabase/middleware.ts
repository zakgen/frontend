import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSafeRedirectPath, getSupabaseConfig } from "@/lib/supabase/config";

const LOGIN_PATH = "/login";
const AUTH_REDIRECT_ROUTES = new Set(["/login", "/signup", "/forgot-password"]);

export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isConfigured) {
    return handleRouteAccess(request, supabaseResponse, null);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;

  try {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {
    user = null;
  }

  return handleRouteAccess(request, supabaseResponse, user);
}

function handleRouteAccess(
  request: NextRequest,
  response: NextResponse,
  user: { id: string } | null,
) {
  const path = request.nextUrl.pathname;
  const isDashboardRoute =
    path.startsWith("/dashboard") || path.startsWith("/b/") || path === "/businesses";
  const isAuthRedirectRoute = AUTH_REDIRECT_ROUTES.has(path);

  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set(
      "next",
      getSafeRedirectPath(`${path}${request.nextUrl.search}`),
    );
    return redirectWithCookies(loginUrl, response);
  }

  if (user && isAuthRedirectRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    return redirectWithCookies(dashboardUrl, response);
  }

  return response;
}

function redirectWithCookies(url: URL, sourceResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
