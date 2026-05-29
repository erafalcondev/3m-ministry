import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales, type Locale } from "./i18n/config";
import { updateSession } from "./lib/supabase/proxy";

const PUBLIC_FILE = /\.(.*)$/;

function detectLocale(pathname: string): { locale: Locale | null; rest: string } {
  for (const loc of locales) {
    if (pathname === `/${loc}`) return { locale: loc, rest: "" };
    if (pathname.startsWith(`/${loc}/`)) return { locale: loc, rest: pathname.slice(loc.length + 1) };
  }
  return { locale: null, rest: pathname };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return;
  }

  // 1. Locale redirect
  const { locale, rest } = detectLocale(pathname);
  if (!locale) {
    const accept = request.headers.get("accept-language") ?? "";
    const preferred: Locale = accept.toLowerCase().startsWith("en") ? "en" : defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // 2. Refresh Supabase session on every request (cookies need rotation).
  //    Only run when env is configured so the marketing site keeps working
  //    until the user finishes the Supabase setup.
  const response = NextResponse.next();
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const { user } = await updateSession(request, response);

    // 3. Gate /portail/*
    if (rest.startsWith("/portail")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set("from", `${locale}${rest}`);
        return NextResponse.redirect(url);
      }
    }
  } else if (rest.startsWith("/portail") || rest === "/login" || rest === "/register") {
    // Supabase not configured yet — send users to a friendly page.
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
