import { NextResponse, type NextRequest } from "next/server";

/**
 * Markdown negotiation middleware (spec §6):
 * Accept: text/markdown on /scan/* rewrites to the /api/scan/markdown route
 * handler (Next.js forbids route.ts beside page.tsx).
 */
export function middleware(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/scan/") && accept.includes("text/markdown")) {
    const host = pathname.replace(/^\/scan\//, "").replace(/\/$/, "");
    const url = req.nextUrl.clone();
    url.pathname = "/api/scan/markdown";
    url.searchParams.set("host", decodeURIComponent(host));
    const headers = new Headers(req.headers);
    headers.set("x-markdown-host", decodeURIComponent(host));
    const res = NextResponse.rewrite(url, { headers });
    res.headers.set("Vary", "Accept");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/scan/:path*"],
};
