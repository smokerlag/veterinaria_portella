import { NextRequest, NextResponse } from "next/server";
import {
  createUsuario,
  deleteUsuario,
  getCurrentUser,
  listUsuarios,
  updateUsuario,
  type UserRole,
  ROLES,
} from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

function isRole(value: string): value is UserRole {
  return (ROLES as string[]).includes(value);
}

export async function GET() {
  getDb();
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (me.rol !== "admin") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }
  return NextResponse.json(listUsuarios());
}

export async function POST(req: NextRequest) {
  getDb();
  const me = await getCurrentUser();
  if (!me || me.rol !== "admin") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }

  const body = await req.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const nombre = String(body.nombre || "").trim();
  const rol = String(body.rol || "");

  if (!username || !password || !nombre || !isRole(rol)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    const id = createUsuario({ username, password, nombre, rol });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo crear";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  getDb();
  const me = await getCurrentUser();
  if (!me || me.rol !== "admin") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }

  const body = await req.json();
  const id = Number(body.id);
  const username = String(body.username || "").trim();
  const nombre = String(body.nombre || "").trim();
  const rol = String(body.rol || "");
  const activo = Number(body.activo ?? 1);
  const password = body.password ? String(body.password) : undefined;

  if (!id || !username || !nombre || !isRole(rol)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    updateUsuario(id, { username, nombre, rol, activo, password });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo actualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  getDb();
  const me = await getCurrentUser();
  if (!me || me.rol !== "admin") {
    return NextResponse.json({ error: "Solo administrador" }, { status: 403 });
  }

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  if (id === me.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propio usuario" },
      { status: 400 }
    );
  }

  try {
    deleteUsuario(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo eliminar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
