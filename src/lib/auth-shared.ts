export const SESSION_COOKIE = "vp_session";
export const SESSION_MAX_AGE_SECONDS = 2 * 60 * 60;

/** Secreto local. Opcional: define SESSION_SECRET en el entorno. */
export const SESSION_SECRET =
  process.env.SESSION_SECRET || "veterinaria-portella-local-2026";

export type UserRole = "admin" | "veterinario" | "asistente";

export type SessionUser = {
  id: number;
  username: string;
  nombre: string;
  rol: UserRole;
};

export const ROLES: UserRole[] = ["admin", "veterinario", "asistente"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  veterinario: "Veterinario",
  asistente: "Asistente",
};

function bytesToBase64Url(bytes: ArrayBuffer) {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Verificación compatible con middleware (Edge / Web Crypto). */
export async function verifySessionTokenEdge(
  token: string | undefined | null,
  secret: string
): Promise<SessionUser | null> {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  if (bytesToBase64Url(signature) !== sig) return null;

  try {
    const pad = body.length % 4 === 0 ? "" : "=".repeat(4 - (body.length % 4));
    const json = atob(body.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const payload = JSON.parse(json) as SessionUser & {
      iat: number;
      exp: number;
    };
    const now = Date.now();
    if (
      !payload?.id ||
      !payload.iat ||
      !payload.exp ||
      payload.iat > now ||
      payload.iat < now - SESSION_MAX_AGE_SECONDS * 1000 ||
      payload.exp <= now ||
      payload.exp - payload.iat > SESSION_MAX_AGE_SECONDS * 1000
    ) return null;
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
