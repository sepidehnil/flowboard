import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authRoutes = ["/login", "/register", "/forgot-password"];
const protectedPrefixes = ["/dashboard"];

function sessionCookieOptions(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps =
    forwardedProto === "https" ||
    request.nextUrl.protocol === "https:" ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production";

  // Auth.js v5 uses __Secure- prefix on HTTPS (Vercel production/preview)
  const cookieName = isHttps
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  return {
    secureCookie: isHttps,
    cookieName,
    salt: cookieName,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieOpts = sessionCookieOptions(request);

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    ...cookieOpts,
  });
  const isAuthenticated = Boolean(token);

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
