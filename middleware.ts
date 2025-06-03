import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = Boolean(
    request.cookies.get("middleware_token")?.value
  );

  console.log(
    `Middleware check: isAuthenticated=${isAuthenticated}, pathname=${pathname}`
  );

  const isAuthPage = pathname === "/signin";
  const isProtectedRoute = pathname === "/";

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
