import { NextRequest, NextResponse } from "next/server";
import {
  createCita,
  deleteCita,
  listCitas,
  updateCita,
} from "@/lib/queries";
import { requireDeletePermission } from "@/lib/api-auth";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const fecha = req.nextUrl.searchParams.get("fecha") || undefined;
  const from = req.nextUrl.searchParams.get("from") || undefined;
  const to = req.nextUrl.searchParams.get("to") || undefined;
  return NextResponse.json(listCitas({ fecha, from, to }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.mascota_id || !body.fecha || !body.hora || !body.motivo?.trim()) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const id = createCita(body);
  return NextResponse.json({ id }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (
    !body.id ||
    !body.mascota_id ||
    !body.fecha ||
    !body.hora ||
    !body.motivo?.trim()
  ) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  updateCita(Number(body.id), body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireDeletePermission();
  if (gate instanceof NextResponse) return gate;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  deleteCita(Number(id));
  return NextResponse.json({ ok: true });
}
