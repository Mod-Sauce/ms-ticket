import { verifyToken } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  let user = null;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) user = payload;
  }

  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  const publicRoutes = ["/", "/login", "/register", "/tickets"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isTicketDetail = /^\/tickets\/[a-f0-9-]+$/.test(pathname);
  const isApiAuth = pathname.startsWith("/api/auth/");

  if (isPublicRoute || isTicketDetail || isApiAuth) {
    return NextResponse.next();
  }

  // Protected routes - require session
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health).*)",
  ],
};
