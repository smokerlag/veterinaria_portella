import { NextRequest, NextResponse } from "next/server";
import {
  createPendiente,
  deletePendiente,
  listPendientes,
  updatePendiente,
} from "@/lib/queries";
import { requireDeletePermission } from "@/lib/api-auth";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  return NextResponse.json(listPendientes(all));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.titulo?.trim()) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  }
  const id = createPendiente(body);
  return NextResponse.json({ id }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id || !body.titulo?.trim()) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  updatePendiente(Number(body.id), body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireDeletePermission();
  if (gate instanceof NextResponse) return gate;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  deletePendiente(Number(id));
  return NextResponse.json({ ok: true });
}
