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
  diagnostico: string | null;
  tratamiento: string | null;
  peso_kg: number | null;
  temperatura_c: number | null;
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
export const ESTADOS_CITA = [
  "programada",
  "confirmada",
  "en_curso",
  "completada",
  "cancelada",
  "no_asistio",
] as const;
