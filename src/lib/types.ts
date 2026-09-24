export type Cliente = {
  id: number;
  nombre: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  creado_en: string;
};

export type Mascota = {
  id: number;
  cliente_id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: "macho" | "hembra" | "desconocido";
  fecha_nacimiento: string | null;
  color: string | null;
  peso_kg: number | null;
  microchip: string | null;
  activo: number;
  notas: string | null;
  creado_en: string;
  cliente_nombre?: string;
};

export type Cita = {
  id: number;
  mascota_id: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: string;
  veterinario: string | null;
  notas: string | null;
  creado_en: string;
  mascota_nombre?: string;
  especie?: string;
  cliente_nombre?: string;
  cliente_telefono?: string | null;
};

export type Historial = {
  id: number;
  mascota_id: number;
  fecha: string;
  tipo: string;
  motivo_consulta: string | null;
  anamnesis: string | null;
  temperatura_c: number | null;
  fc_lpm: number | null;
  fr_rpm: number | null;
  estado_hidratacion: string | null;
  mucosas: string | null;
  tllc_seg: number | null;
  condicion_corporal: string | null;
  hallazgos: string | null;
  examenes_complementarios: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  evolucion_observaciones: string | null;
  pronostico: string | null;
  peso_kg: number | null;
  notas: string | null;
  veterinario: string | null;
  creado_en: string;
  mascota_nombre?: string;
  cliente_nombre?: string;
};

export type Pendiente = {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  prioridad: "baja" | "media" | "alta";
  estado: "pendiente" | "en_progreso" | "hecho";
  mascota_id: number | null;
  cliente_id: number | null;
  creado_en: string;
  mascota_nombre?: string | null;
  cliente_nombre?: string | null;
};

export const ESPECIES = ["perro", "gato", "ave", "conejo", "reptil", "otro"] as const;

export function labelEspecie(especie: string) {
  if (!especie) return "";
  return especie.charAt(0).toUpperCase() + especie.slice(1).toLowerCase();
}
export const TIPOS_HISTORIAL = [
  "consulta",
  "vacuna",
  "cirugia",
  "laboratorio",
  "desparasitacion",
  "urgencia",
  "otro",
] as const;

export const PRONOSTICOS = [
  { value: "favorable", label: "Favorable" },
  { value: "reservado", label: "Reservado" },
  { value: "desfavorable", label: "Desfavorable" },
  { value: "en_observacion", label: "En observación" },
] as const;

export function labelPronostico(value: string) {
  const found = PRONOSTICOS.find((p) => p.value === value);
  return found?.label || value;
}

export function parsePronosticos(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
export const ESTADOS_CITA = [
  "programada",
  "confirmada",
  "en_curso",
  "completada",
  "cancelada",
  "no_asistio",
] as const;
