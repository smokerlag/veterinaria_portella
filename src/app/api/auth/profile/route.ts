import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getCurrentUser,
  SESSION_COOKIE,
  sessionCookieOptions,
  updateOwnProfile,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { username?: unknown; nombre?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const username = String(body.username || "").trim();
  const nombre = String(body.nombre || "").trim();
  if (username.length < 2 || username.length > 40 || !nombre || nombre.length > 120) {
    return NextResponse.json(
      { error: "Ingresa un usuario válido y tu nombre completo" },
      { status: 400 }
    );
  }

  try {
    updateOwnProfile(user.id, username, nombre);
  } catch {
    return NextResponse.json(
      { error: "Ese nombre de usuario ya está en uso" },
      { status: 409 }
    );
  }

  const updatedUser = { ...user, username: username.toLowerCase(), nombre };
  const res = NextResponse.json({ user: updatedUser });
  res.cookies.set(SESSION_COOKIE, createSessionToken(updatedUser), sessionCookieOptions());
  return res;
}
