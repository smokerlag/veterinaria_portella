import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  findUsuarioByUsername,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  getDb();
  const body = await req.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña requeridos" },
      { status: 400 }
    );
  }

  const user = findUsuarioByUsername(username);
  if (!user || !user.activo || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const token = createSessionToken({
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
  });

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
