import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "crypto";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "veterinaria.db");

let db: DatabaseSync | null = null;

export function getDb() {
  if (db) return db;

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  ensureDefaultUsers(db);
  return db;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function ensureDefaultUsers(database: DatabaseSync) {
  const defaults = [
    {
      username: "admin",
      password: "admin123",
      nombre: "Administrador",
      rol: "admin",
    },
    {
      username: "veterinario",
      password: "vet123",
      nombre: "Veterinario",
      rol: "veterinario",
    },
    {
      username: "asistente",
      password: "asis123",
      nombre: "Asistente",
      rol: "asistente",
    },
  ] as const;

  const find = database.prepare(
    `SELECT id FROM usuarios WHERE username = ? COLLATE NOCASE`
  );
  const insert = database.prepare(
    `INSERT INTO usuarios (username, password_hash, nombre, rol)
     VALUES (?, ?, ?, ?)`
  );

  for (const user of defaults) {
    const exists = find.get(user.username);
    if (!exists) {
      insert.run(
        user.username,
        hashPassword(user.password),
        user.nombre,
        user.rol
      );
    }
  }
}

function migrateUsuariosRoles(database: DatabaseSync) {
  const info = database
    .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='usuarios'`)
    .get() as { sql?: string } | undefined;
  if (!info?.sql) return;
  if (info.sql.includes("'veterinario'") && info.sql.includes("'asistente'")) {
    return;
  }

  database.exec(`
    CREATE TABLE usuarios_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'asistente'
        CHECK (rol IN ('admin','veterinario','asistente')),
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    INSERT INTO usuarios_new (id, username, password_hash, nombre, rol, activo, creado_en)
    SELECT
      id,
      username,
      password_hash,
      nombre,
      CASE
        WHEN rol = 'staff' THEN 'asistente'
        WHEN rol IN ('admin','veterinario','asistente') THEN rol
        ELSE 'asistente'
      END,
      activo,
      creado_en
    FROM usuarios;

    DROP TABLE usuarios;
    ALTER TABLE usuarios_new RENAME TO usuarios;
  `);
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      dni TEXT,
      telefono TEXT,
      email TEXT,
      direccion TEXT,
      notas TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS mascotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      especie TEXT NOT NULL DEFAULT 'perro',
      raza TEXT,
      sexo TEXT CHECK (sexo IN ('macho','hembra','desconocido')) DEFAULT 'desconocido',
      fecha_nacimiento TEXT,
      color TEXT,
      peso_kg REAL,
      microchip TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      notas TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mascota_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      motivo TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'programada'
        CHECK (estado IN ('programada','confirmada','en_curso','completada','cancelada','no_asistio')),
      veterinario TEXT,
      notas TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historial_clinico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mascota_id INTEGER NOT NULL,
      fecha TEXT NOT NULL DEFAULT (date('now','localtime')),
      tipo TEXT NOT NULL DEFAULT 'consulta'
        CHECK (tipo IN ('consulta','vacuna','cirugia','laboratorio','desparasitacion','urgencia','otro')),
      diagnostico TEXT,
      tratamiento TEXT,
      peso_kg REAL,
      temperatura_c REAL,
      notas TEXT,
      veterinario TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha_limite TEXT,
      prioridad TEXT NOT NULL DEFAULT 'media'
        CHECK (prioridad IN ('baja','media','alta')),
      estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','en_progreso','hecho')),
      mascota_id INTEGER,
      cliente_id INTEGER,
      creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE SET NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'asistente'
        CHECK (rol IN ('admin','veterinario','asistente')),
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_mascotas_cliente ON mascotas(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
    CREATE INDEX IF NOT EXISTS idx_citas_mascota ON citas(mascota_id);
    CREATE INDEX IF NOT EXISTS idx_historial_mascota ON historial_clinico(mascota_id);
    CREATE INDEX IF NOT EXISTS idx_pendientes_estado ON pendientes(estado);
  `);

  migrateUsuariosRoles(database);
  ensureClienteDniColumn(database);
}

function ensureClienteDniColumn(database: DatabaseSync) {
  const cols = database.prepare(`PRAGMA table_info(clientes)`).all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === "dni")) {
    database.exec(`ALTER TABLE clientes ADD COLUMN dni TEXT`);
  }
}
