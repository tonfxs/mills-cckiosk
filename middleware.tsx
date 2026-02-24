import { NextRequest, NextResponse } from "next/server";

// Routes only accessible by superadmin or admin
const ADMIN_ONLY_ROUTES = [
  "/admin/users",
  "/admin/settings",
];

// All routes that require any login
const PROTECTED_ROUTES = ["/admin"];

// Auth routes — redirect away if already logged in
const AUTH_ROUTES = ["/login", "/signup"];

const ADMIN_ROLES = ["superadmin", "admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get("session")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Not logged in → redirect to login
  if (isProtectedRoute && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Not superadmin or admin → redirect to dashboard
  if (isAdminOnlyRoute && !ADMIN_ROLES.includes(userRole ?? "")) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Already logged in → skip auth pages
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};