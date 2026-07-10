import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_HOST_PREFIX = "admin.";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  if (!hostname.startsWith(ADMIN_HOST_PREFIX)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
