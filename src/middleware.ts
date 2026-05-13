import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/admin-session";

function isAdminLoginPath(pathname: string) {
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

function needsAdminSession(pathname: string): boolean {
  if (pathname.startsWith("/api/admin/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return !isAdminLoginPath(pathname);
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!needsAdminSession(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (!secret) {
    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Admin auth not configured" }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const ok = token && (await verifyAdminSessionToken(token, secret));

  if (ok) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)/", "/", "/(api|trpc)(.*)"],
};
