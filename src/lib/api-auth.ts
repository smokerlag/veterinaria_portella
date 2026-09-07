import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import {
  assertCanDelete,
  assertCanWriteHistorial,
} from "@/lib/permissions";

export async function requireApiUser(): Promise<
  SessionUser | NextResponse
> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return user;
}

export function forbid(message: string, status = 403) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireDeletePermission() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  try {
    assertCanDelete(user);
    return user;
  } catch (e) {
    return forbid(e instanceof Error ? e.message : "Sin permiso");
  }
}

export async function requireHistorialWritePermission() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  try {
    assertCanWriteHistorial(user);
    return user;
  } catch (e) {
    return forbid(e instanceof Error ? e.message : "Sin permiso");
  }
}
