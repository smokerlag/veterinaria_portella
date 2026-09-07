"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABELS, type UserRole } from "@/lib/auth-shared";
import { canManageUsers } from "@/lib/permissions";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/clientes", label: "Clientes" },
  { href: "/mascotas", label: "Mascotas" },
  { href: "/citas", label: "Calendario" },
  { href: "/historial", label: "Historial clínico" },
  { href: "/pendientes", label: "Pendientes" },
];

type Me = { nombre: string; username: string; rol: UserRole };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const navLinks =
    user && canManageUsers(user.rol)
      ? [...links, { href: "/usuarios", label: "Usuarios" }]
      : links;

  return (
    <aside className="sidebar">
      <div className="brand">
        <p className="brand-kicker">Clínica local</p>
        <h1>Veterinaria Portella</h1>
      </div>
      <nav className="nav">
        {navLinks.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "active" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-note">
        {user ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <strong>{user.nombre}</strong>
              <div style={{ opacity: 0.8 }}>
                @{user.username} · {ROLE_LABELS[user.rol]}
              </div>
            </div>
            <button
              type="button"
              className="btn secondary small"
              style={{ width: "100%" }}
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          "Sesión local de la clínica"
        )}
      </div>
    </aside>
  );
}
