"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth-shared";
import {
  canDeleteRecords,
  canManageUsers,
  canWriteHistorial,
} from "@/lib/permissions";

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const role = user?.rol;
  return {
    user,
    loading,
    canDelete: role ? canDeleteRecords(role) : false,
    canWriteHistorial: role ? canWriteHistorial(role) : false,
    canManageUsers: role ? canManageUsers(role) : false,
  };
}
