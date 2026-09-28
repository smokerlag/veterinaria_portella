import { NextRequest, NextResponse } from "next/server";
import {
  createCliente,
  deleteCliente,
  listClientes,
  updateCliente,
} from "@/lib/queries";
import { requireDeletePermission } from "@/lib/api-auth";
import {
  normalizeClienteFields,
  validateClienteFields,
} from "@/lib/validation";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || undefined;
  return NextResponse.json(listClientes(q));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fields = normalizeClienteFields(body);
  const error = validateClienteFields(fields);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  const id = createCliente(fields);
  return NextResponse.json({ id }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const fields = normalizeClienteFields(body);
  const error = validateClienteFields(fields);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  updateCliente(Number(body.id), fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireDeletePermission();
  if (gate instanceof NextResponse) return gate;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  deleteCliente(Number(id));
  return NextResponse.json({ ok: true });
}
