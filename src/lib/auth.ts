import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import {
  ROLES,
  SESSION_COOKIE,
  SESSION_SECRET,
  type SessionUser,
  type UserRole,
} from "./auth-shared";

export {
  SESSION_COOKIE,
  SESSION_SECRET,
  verifySessionTokenEdge,
  ROLES,
  ROLE_LABELS,
  type SessionUser,
  type UserRole,
} from "./auth-shared";

const SESSION_DAYS = 7;

export type Usuario = SessionUser & {
  activo: number;
  creado_en: string;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(
    input.replace(/-/g, "+").replace(/_/g, "/") + pad,
    "base64"
  );
}

export function createSessionToken(user: SessionUser) {
  const payload = {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function parseSessionToken(
  token: string | undefined | null
): SessionUser | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as SessionUser & {
      exp: number;
    };
    if (!payload?.id || !payload.exp || payload.exp < Date.now()) return null;
    if (!ROLES.includes(payload.rol)) return null;
    return {
      id: payload.id,
      username: payload.username,
      nombre: payload.nombre,
      rol: payload.rol,
    };
  } catch {
    return null;
  }
}

export function findUsuarioByUsername(username: string) {
  return getDb()
    .prepare(
      `SELECT id, username, password_hash, nombre, rol, activo, creado_en
       FROM usuarios WHERE username = ? COLLATE NOCASE`
    )
    .get(username.trim()) as
    | (Usuario & { password_hash: string })
    | undefined;
}

export function listUsuarios(): Usuario[] {
  return getDb()
    .prepare(
      `SELECT id, username, nombre, rol, activo, creado_en
       FROM usuarios
       ORDER BY
         CASE rol WHEN 'admin' THEN 0 WHEN 'veterinario' THEN 1 ELSE 2 END,
         username COLLATE NOCASE`
    )
    .all() as Usuario[];
}

export function createUsuario(data: {
  username: string;
  password: string;
  nombre: string;
  rol: UserRole;
}) {
  if (!ROLES.includes(data.rol)) {
    throw new Error("Rol inválido");
  }
  const result = getDb()
    .prepare(
      `INSERT INTO usuarios (username, password_hash, nombre, rol)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      data.username.trim().toLowerCase(),
      hashPassword(data.password),
      data.nombre.trim(),
      data.rol
    );
  return Number(result.lastInsertRowid);
}

export function updateUsuario(
  id: number,
  data: {
    username: string;
    nombre: string;
    rol: UserRole;
    activo: number;
    password?: string;
  }
) {
  if (!ROLES.includes(data.rol)) {
    throw new Error("Rol inválido");
  }
  if (data.password?.trim()) {
    getDb()
      .prepare(
        `UPDATE usuarios
         SET username = ?, nombre = ?, rol = ?, activo = ?, password_hash = ?
         WHERE id = ?`
      )
      .run(
        data.username.trim().toLowerCase(),
        data.nombre.trim(),
        data.rol,
        data.activo,
        hashPassword(data.password),
        id
      );
    return;
  }
  getDb()
    .prepare(
      `UPDATE usuarios
       SET username = ?, nombre = ?, rol = ?, activo = ?
       WHERE id = ?`
    )
    .run(
      data.username.trim().toLowerCase(),
      data.nombre.trim(),
      data.rol,
      data.activo,
      id
    );
}

export function deleteUsuario(id: number) {
  const user = getDb()
    .prepare(`SELECT rol FROM usuarios WHERE id = ?`)
    .get(id) as { rol: string } | undefined;
  if (!user) return;
  if (user.rol === "admin") {
    const admins = (
      getDb()
        .prepare(
          `SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'admin' AND activo = 1`
        )
        .get() as { n: number }
    ).n;
    if (admins <= 1) {
      throw new Error("No se puede eliminar el único administrador activo");
    }
  }
  getDb().prepare(`DELETE FROM usuarios WHERE id = ?`).run(id);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.rol !== "admin") throw new Error("Solo administrador");
  return user;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return parseSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(
  maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
