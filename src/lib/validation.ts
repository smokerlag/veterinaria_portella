/** Validación de datos de contacto (formato Perú). */

export function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function validateNombre(value: string): string | null {
  const v = String(value || "").trim();
  if (!v) return "El nombre es obligatorio";
  if (v.length < 2) return "El nombre es demasiado corto";
  if (v.length > 120) return "El nombre es demasiado largo";
  return null;
}

/** DNI: exactamente 8 dígitos. Obligatorio. */
export function validateDni(value: string): string | null {
  const d = digitsOnly(value);
  if (!d) return "El DNI es obligatorio";
  if (!/^\d{8}$/.test(d)) return "El DNI debe tener exactamente 8 dígitos";
  return null;
}

/** Celular: exactamente 9 dígitos. Obligatorio. */
export function validateCelular(value: string): string | null {
  const d = digitsOnly(value);
  if (!d) return "El celular es obligatorio";
  if (!/^\d{9}$/.test(d)) return "El celular debe tener exactamente 9 dígitos";
  return null;
}

/** Email: obligatorio y con formato de correo. */
export function validateEmail(value: string): string | null {
  const v = String(value || "").trim();
  if (!v) return "El email es obligatorio";
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)) {
    return "El email debe tener formato de correo (ej. nombre@dominio.com)";
  }
  return null;
}

export type ClienteInput = {
  nombre?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
};

export function normalizeClienteFields(data: ClienteInput) {
  return {
    nombre: String(data.nombre || "").trim(),
    dni: digitsOnly(String(data.dni || "")),
    telefono: digitsOnly(String(data.telefono || "")),
    email: String(data.email || "").trim().toLowerCase(),
    direccion: String(data.direccion || "").trim(),
    notas: String(data.notas || "").trim(),
  };
}

/** Devuelve el primer error o null si todo ok. */
export function validateClienteFields(data: ClienteInput): string | null {
  const n = normalizeClienteFields(data);
  return (
    validateNombre(n.nombre) ||
    validateDni(n.dni) ||
    validateCelular(n.telefono) ||
    validateEmail(n.email)
  );
}
