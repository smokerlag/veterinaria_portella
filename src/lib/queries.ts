import { getDb } from "./db";
import type { Cita, Cliente, Historial, Mascota, Pendiente } from "./types";

export function listClientes(q?: string): Cliente[] {
  const db = getDb();
  if (q?.trim()) {
    const like = `%${q.trim()}%`;
    return db
      .prepare(
        `SELECT * FROM clientes
         WHERE nombre LIKE ? OR dni LIKE ? OR telefono LIKE ? OR email LIKE ?
         ORDER BY nombre COLLATE NOCASE`
      )
      .all(like, like, like, like) as Cliente[];
  }
  return db
    .prepare(`SELECT * FROM clientes ORDER BY nombre COLLATE NOCASE`)
    .all() as Cliente[];
}

export function getCliente(id: number): Cliente | undefined {
  return getDb().prepare(`SELECT * FROM clientes WHERE id = ?`).get(id) as
    | Cliente
    | undefined;
}

export function createCliente(data: {
  nombre: string;
  dni?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO clientes (nombre, dni, telefono, email, direccion, notas)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.nombre.trim(),
      data.dni?.trim() || null,
      data.telefono?.trim() || null,
      data.email?.trim() || null,
      data.direccion?.trim() || null,
      data.notas?.trim() || null
    );
  return Number(result.lastInsertRowid);
}

export function updateCliente(
  id: number,
  data: {
    nombre: string;
    dni?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    notas?: string;
  }
) {
  getDb()
    .prepare(
      `UPDATE clientes
       SET nombre = ?, dni = ?, telefono = ?, email = ?,
           direccion = ?, notas = ?
       WHERE id = ?`
    )
    .run(
      data.nombre.trim(),
      data.dni?.trim() || null,
      data.telefono?.trim() || null,
      data.email?.trim() || null,
      data.direccion?.trim() || null,
      data.notas?.trim() || null,
      id
    );
}

export function deleteCliente(id: number) {
  getDb().prepare(`DELETE FROM clientes WHERE id = ?`).run(id);
}

export function listMascotas(opts?: {
  q?: string;
  clienteId?: number;
}): Mascota[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (opts?.clienteId) {
    clauses.push(`m.cliente_id = ?`);
    params.push(opts.clienteId);
  }
  if (opts?.q?.trim()) {
    clauses.push(
      `(m.nombre LIKE ? OR m.especie LIKE ? OR m.raza LIKE ? OR c.nombre LIKE ?)`
    );
    const like = `%${opts.q.trim()}%`;
    params.push(like, like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT m.*, c.nombre AS cliente_nombre
       FROM mascotas m
       JOIN clientes c ON c.id = m.cliente_id
       ${where}
       ORDER BY m.nombre COLLATE NOCASE`
    )
    .all(...params) as Mascota[];
}

export function getMascota(id: number): Mascota | undefined {
  return getDb()
    .prepare(
      `SELECT m.*, c.nombre AS cliente_nombre
       FROM mascotas m
       JOIN clientes c ON c.id = m.cliente_id
       WHERE m.id = ?`
    )
    .get(id) as Mascota | undefined;
}

export function createMascota(data: {
  cliente_id: number;
  nombre: string;
  especie: string;
  raza?: string;
  sexo?: string;
  fecha_nacimiento?: string;
  color?: string;
  peso_kg?: number | null;
  microchip?: string;
  notas?: string;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO mascotas
       (cliente_id, nombre, especie, raza, sexo, fecha_nacimiento, color, peso_kg, microchip, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.cliente_id,
      data.nombre.trim(),
      data.especie || "perro",
      data.raza?.trim() || null,
      data.sexo || "desconocido",
      data.fecha_nacimiento || null,
      data.color?.trim() || null,
      data.peso_kg ?? null,
      data.microchip?.trim() || null,
      data.notas?.trim() || null
    );
  return Number(result.lastInsertRowid);
}

export function updateMascota(
  id: number,
  data: {
    cliente_id: number;
    nombre: string;
    especie: string;
    raza?: string;
    sexo?: string;
    fecha_nacimiento?: string;
    color?: string;
    peso_kg?: number | null;
    microchip?: string;
    activo?: number;
    notas?: string;
  }
) {
  getDb()
    .prepare(
      `UPDATE mascotas SET
         cliente_id = ?,
         nombre = ?,
         especie = ?,
         raza = ?,
         sexo = ?,
         fecha_nacimiento = ?,
         color = ?,
         peso_kg = ?,
         microchip = ?,
         activo = ?,
         notas = ?
       WHERE id = ?`
    )
    .run(
      data.cliente_id,
      data.nombre.trim(),
      data.especie || "perro",
      data.raza?.trim() || null,
      data.sexo || "desconocido",
      data.fecha_nacimiento || null,
      data.color?.trim() || null,
      data.peso_kg ?? null,
      data.microchip?.trim() || null,
      data.activo ?? 1,
      data.notas?.trim() || null,
      id
    );
}

export function deleteMascota(id: number) {
  getDb().prepare(`DELETE FROM mascotas WHERE id = ?`).run(id);
}

export function listCitas(opts?: {
  from?: string;
  to?: string;
  fecha?: string;
}): Cita[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: string[] = [];

  if (opts?.fecha) {
    clauses.push(`ci.fecha = ?`);
    params.push(opts.fecha);
  }
  if (opts?.from) {
    clauses.push(`ci.fecha >= ?`);
    params.push(opts.from);
  }
  if (opts?.to) {
    clauses.push(`ci.fecha <= ?`);
    params.push(opts.to);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT ci.*,
              m.nombre AS mascota_nombre,
              m.especie,
              c.nombre AS cliente_nombre,
              c.telefono AS cliente_telefono
       FROM citas ci
       JOIN mascotas m ON m.id = ci.mascota_id
       JOIN clientes c ON c.id = m.cliente_id
       ${where}
       ORDER BY ci.fecha, ci.hora`
    )
    .all(...params) as Cita[];
}

export function createCita(data: {
  mascota_id: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado?: string;
  veterinario?: string;
  notas?: string;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO citas (mascota_id, fecha, hora, motivo, estado, veterinario, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.mascota_id,
      data.fecha,
      data.hora,
      data.motivo.trim(),
      data.estado || "programada",
      data.veterinario?.trim() || null,
      data.notas?.trim() || null
    );
  return Number(result.lastInsertRowid);
}

export function updateCita(
  id: number,
  data: {
    mascota_id: number;
    fecha: string;
    hora: string;
    motivo: string;
    estado: string;
    veterinario?: string;
    notas?: string;
  }
) {
  getDb()
    .prepare(
      `UPDATE citas SET
         mascota_id = ?,
         fecha = ?,
         hora = ?,
         motivo = ?,
         estado = ?,
         veterinario = ?,
         notas = ?
       WHERE id = ?`
    )
    .run(
      data.mascota_id,
      data.fecha,
      data.hora,
      data.motivo.trim(),
      data.estado,
      data.veterinario?.trim() || null,
      data.notas?.trim() || null,
      id
    );
}

export function deleteCita(id: number) {
  getDb().prepare(`DELETE FROM citas WHERE id = ?`).run(id);
}

export function listHistorial(mascotaId?: number): Historial[] {
  const db = getDb();
  if (mascotaId) {
    return db
      .prepare(
        `SELECT h.*, m.nombre AS mascota_nombre, c.nombre AS cliente_nombre
         FROM historial_clinico h
         JOIN mascotas m ON m.id = h.mascota_id
         JOIN clientes c ON c.id = m.cliente_id
         WHERE h.mascota_id = ?
         ORDER BY h.fecha DESC, h.id DESC`
      )
      .all(mascotaId) as Historial[];
  }
  return db
    .prepare(
      `SELECT h.*, m.nombre AS mascota_nombre, c.nombre AS cliente_nombre
       FROM historial_clinico h
       JOIN mascotas m ON m.id = h.mascota_id
       JOIN clientes c ON c.id = m.cliente_id
       ORDER BY h.fecha DESC, h.id DESC
       LIMIT 100`
    )
    .all() as Historial[];
}

export function createHistorial(data: {
  mascota_id: number;
  fecha: string;
  tipo: string;
  motivo_consulta?: string;
  anamnesis?: string;
  temperatura_c?: number | null;
  fc_lpm?: number | null;
  fr_rpm?: number | null;
  estado_hidratacion?: string;
  mucosas?: string;
  tllc_seg?: number | null;
  condicion_corporal?: string;
  hallazgos?: string;
  examenes_complementarios?: string;
  diagnostico?: string;
  tratamiento?: string;
  evolucion_observaciones?: string;
  pronostico?: string;
  peso_kg?: number | null;
  notas?: string;
  veterinario?: string;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO historial_clinico
       (mascota_id, fecha, tipo, motivo_consulta, anamnesis, temperatura_c,
        fc_lpm, fr_rpm, estado_hidratacion, mucosas, tllc_seg, condicion_corporal,
        hallazgos, examenes_complementarios, diagnostico, tratamiento,
        evolucion_observaciones, pronostico, peso_kg, notas, veterinario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.mascota_id,
      data.fecha,
      data.tipo || "consulta",
      data.motivo_consulta?.trim() || null,
      data.anamnesis?.trim() || null,
      data.temperatura_c ?? null,
      data.fc_lpm ?? null,
      data.fr_rpm ?? null,
      data.estado_hidratacion?.trim() || null,
      data.mucosas?.trim() || null,
      data.tllc_seg ?? null,
      data.condicion_corporal?.trim() || null,
      data.hallazgos?.trim() || null,
      data.examenes_complementarios?.trim() || null,
      data.diagnostico?.trim() || null,
      data.tratamiento?.trim() || null,
      data.evolucion_observaciones?.trim() || null,
      data.pronostico?.trim() || null,
      data.peso_kg ?? null,
      data.notas?.trim() || null,
      data.veterinario?.trim() || null
    );
  return Number(result.lastInsertRowid);
}

export function deleteHistorial(id: number) {
  getDb().prepare(`DELETE FROM historial_clinico WHERE id = ?`).run(id);
}

export function listPendientes(includeDone = false): Pendiente[] {
  const db = getDb();
  const where = includeDone ? "" : `WHERE p.estado != 'hecho'`;
  return db
    .prepare(
      `SELECT p.*,
              m.nombre AS mascota_nombre,
              c.nombre AS cliente_nombre
       FROM pendientes p
       LEFT JOIN mascotas m ON m.id = p.mascota_id
       LEFT JOIN clientes c ON c.id = p.cliente_id
       ${where}
       ORDER BY
         CASE p.prioridad WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
         COALESCE(p.fecha_limite, '9999-12-31'),
         p.id DESC`
    )
    .all() as Pendiente[];
}

export function createPendiente(data: {
  titulo: string;
  descripcion?: string;
  fecha_limite?: string;
  prioridad?: string;
  estado?: string;
  mascota_id?: number | null;
  cliente_id?: number | null;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO pendientes
       (titulo, descripcion, fecha_limite, prioridad, estado, mascota_id, cliente_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.titulo.trim(),
      data.descripcion?.trim() || null,
      data.fecha_limite || null,
      data.prioridad || "media",
      data.estado || "pendiente",
      data.mascota_id ?? null,
      data.cliente_id ?? null
    );
  return Number(result.lastInsertRowid);
}

export function updatePendiente(
  id: number,
  data: {
    titulo: string;
    descripcion?: string;
    fecha_limite?: string;
    prioridad: string;
    estado: string;
    mascota_id?: number | null;
    cliente_id?: number | null;
  }
) {
  getDb()
    .prepare(
      `UPDATE pendientes SET
         titulo = ?,
         descripcion = ?,
         fecha_limite = ?,
         prioridad = ?,
         estado = ?,
         mascota_id = ?,
         cliente_id = ?
       WHERE id = ?`
    )
    .run(
      data.titulo.trim(),
      data.descripcion?.trim() || null,
      data.fecha_limite || null,
      data.prioridad,
      data.estado,
      data.mascota_id ?? null,
      data.cliente_id ?? null,
      id
    );
}

export function deletePendiente(id: number) {
  getDb().prepare(`DELETE FROM pendientes WHERE id = ?`).run(id);
}

export function getDashboardStats() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const clientes = (
    db.prepare(`SELECT COUNT(*) AS n FROM clientes`).get() as { n: number }
  ).n;
  const mascotas = (
    db.prepare(`SELECT COUNT(*) AS n FROM mascotas WHERE activo = 1`).get() as {
      n: number;
    }
  ).n;
  const citasHoy = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM citas
         WHERE fecha = ? AND estado NOT IN ('cancelada','no_asistio')`
      )
      .get(today) as { n: number }
  ).n;
  const pendientes = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM pendientes WHERE estado != 'hecho'`)
      .get() as { n: number }
  ).n;

  return { clientes, mascotas, citasHoy, pendientes, today };
}
