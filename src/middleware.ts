import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_SECRET,
  verifySessionTokenEdge,
} from "@/lib/auth-shared";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";
  const isLoginApi = pathname.startsWith("/api/auth/login");

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySessionTokenEdge(token, SESSION_SECRET);

  if (isLogin) {
    if (user) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (isLoginApi) return NextResponse.next();

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
