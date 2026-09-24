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

  const num = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const pronostico = Array.isArray(body.pronostico)
    ? body.pronostico.filter(Boolean).join(",")
    : String(body.pronostico || "");

  const id = createHistorial({
    mascota_id: Number(body.mascota_id),
    fecha: String(body.fecha),
    tipo: String(body.tipo),
    motivo_consulta: String(body.motivo_consulta || ""),
    anamnesis: String(body.anamnesis || ""),
    temperatura_c: num(body.temperatura_c),
    fc_lpm: num(body.fc_lpm),
    fr_rpm: num(body.fr_rpm),
    estado_hidratacion: String(body.estado_hidratacion || ""),
    mucosas: String(body.mucosas || ""),
    tllc_seg: num(body.tllc_seg),
    condicion_corporal: String(body.condicion_corporal || ""),
    hallazgos: String(body.hallazgos || ""),
    examenes_complementarios: String(body.examenes_complementarios || ""),
    diagnostico: String(body.diagnostico || ""),
    tratamiento: String(body.tratamiento || ""),
    evolucion_observaciones: String(body.evolucion_observaciones || ""),
    pronostico,
    peso_kg: num(body.peso_kg),
    notas: String(body.notas || ""),
    veterinario: gate.nombre,
  });
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
