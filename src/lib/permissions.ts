import type { SessionUser, UserRole } from "./auth-shared";

export function canManageUsers(role: UserRole) {
  return role === "admin";
}

export function canDeleteRecords(role: UserRole) {
  return role === "admin" || role === "veterinario";
}

export function canWriteHistorial(role: UserRole) {
  return role === "admin" || role === "veterinario";
}

export function canEditRecords(role: UserRole) {
  return role === "admin" || role === "veterinario" || role === "asistente";
}

export function assertCanDelete(user: SessionUser) {
  if (!canDeleteRecords(user.rol)) {
    throw new Error("Tu rol no permite eliminar registros");
  }
}

export function assertCanWriteHistorial(user: SessionUser) {
  if (!canWriteHistorial(user.rol)) {
    throw new Error("Solo veterinarios o administradores pueden modificar el historial clínico");
  }
}

export function assertCanManageUsers(user: SessionUser) {
  if (!canManageUsers(user.rol)) {
    throw new Error("Solo el administrador puede gestionar usuarios");
  }
}
