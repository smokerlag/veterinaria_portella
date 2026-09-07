import { NextRequest, NextResponse } from "next/server";
import {
  createMascota,
  deleteMascota,
  listMascotas,
  updateMascota,
} from "@/lib/queries";
import { requireDeletePermission } from "@/lib/api-auth";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || undefined;
  const clienteId = req.nextUrl.searchParams.get("clienteId");
  return NextResponse.json(
    listMascotas({
      q,
      clienteId: clienteId ? Number(clienteId) : undefined,
    })
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.nombre?.trim() || !body.cliente_id) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const id = createMascota(body);
  return NextResponse.json({ id }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id || !body.nombre?.trim() || !body.cliente_id) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  updateMascota(Number(body.id), body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireDeletePermission();
  if (gate instanceof NextResponse) return gate;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  deleteMascota(Number(id));
  return NextResponse.json({ ok: true });
}
