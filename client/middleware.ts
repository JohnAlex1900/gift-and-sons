import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // If the request is NOT for an API, redirect to home
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}
