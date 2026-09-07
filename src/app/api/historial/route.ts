import { NextRequest, NextResponse } from "next/server";
import {
  createHistorial,
  deleteHistorial,
  listHistorial,
} from "@/lib/queries";
import { requireHistorialWritePermission } from "@/lib/api-auth";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const mascotaId = req.nextUrl.searchParams.get("mascotaId");
  return NextResponse.json(
    listHistorial(mascotaId ? Number(mascotaId) : undefined)
  );
}

export async function POST(req: NextRequest) {
  const gate = await requireHistorialWritePermission();
  if (gate instanceof NextResponse) return gate;

  const body = await req.json();
  if (!body.mascota_id || !body.fecha || !body.tipo) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const id = createHistorial(body);
  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireHistorialWritePermission();
  if (gate instanceof NextResponse) return gate;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  deleteHistorial(Number(id));
  return NextResponse.json({ ok: true });
}
