import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin_session")?.value;
  const adminSecret = (process.env.ADMIN_SECRET || "").trim();

  if (!session || session !== adminSecret) {
    return NextResponse.redirect(new URL("/admin-login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect both /admin and all /admin/* sub-routes
  matcher: ["/admin", "/admin/(.*)"],
};
