"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ROLE_LABELS, type UserRole } from "@/lib/auth-shared";
import { canManageUsers } from "@/lib/permissions";
import { Modal, SubmitRow, apiJson } from "@/components/ui";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError("");
    const data = new FormData(e.currentTarget);
    try {
      const result = await apiJson<{ user: Me }>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          username: String(data.get("username") || ""),
          nombre: String(data.get("nombre") || ""),
        }),
      });
      setUser(result.user);
      setProfileOpen(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "No se pudo guardar el perfil");
    }
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword") || "");
    if (newPassword !== String(data.get("confirmation") || "")) {
      setPasswordError("Las contraseñas nuevas no coinciden");
      return;
    }
    try {
      await apiJson("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: String(data.get("currentPassword") || ""),
          newPassword,
        }),
      });
      form.reset();
      setPasswordSuccess("Tu contraseña se cambió correctamente.");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
    }
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
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, position: "relative" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{user.nombre}</strong>
              <div style={{ opacity: 0.8 }}>
                @{user.username} · {ROLE_LABELS[user.rol]}
              </div>
            </div>
            <button
              type="button"
              className="btn secondary small"
              aria-label="Opciones de cuenta"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              style={{ padding: "0.15rem 0.55rem", fontSize: "1.25rem", lineHeight: 1 }}
              onClick={() => setMenuOpen((open) => !open)}
            >
              ⋮
            </button>
            {menuOpen ? (
              <div className="account-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => {
                  setMenuOpen(false);
                  setProfileError("");
                  setProfileOpen(true);
                }}>
                  Editar mi perfil
                </button>
                <button type="button" role="menuitem" onClick={() => {
                  setMenuOpen(false);
                  setPasswordError("");
                  setPasswordSuccess("");
                  setPasswordOpen(true);
                }}>
                  Cambiar mi contraseña
                </button>
                <button type="button" role="menuitem" onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          "Sesión local de la clínica"
        )}
      </div>
      <Modal open={profileOpen} title="Editar mi perfil" onClose={() => setProfileOpen(false)}>
        <form onSubmit={saveProfile}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="profileName">Nombre completo</label>
              <input id="profileName" name="nombre" defaultValue={user?.nombre || ""} required maxLength={120} />
            </div>
            <div className="field full">
              <label htmlFor="profileUsername">Usuario</label>
              <input id="profileUsername" name="username" defaultValue={user?.username || ""} required minLength={2} maxLength={40} />
            </div>
          </div>
          {profileError ? <p style={{ color: "var(--danger)" }}>{profileError}</p> : null}
          <SubmitRow onCancel={() => setProfileOpen(false)} submitLabel="Guardar perfil" />
        </form>
      </Modal>
      <Modal open={passwordOpen} title="Cambiar mi contraseña" onClose={() => setPasswordOpen(false)}>
        {passwordSuccess ? (
          <>
            <p>{passwordSuccess}</p>
            <button type="button" className="btn" onClick={() => setPasswordOpen(false)}>Cerrar</button>
          </>
        ) : (
          <form onSubmit={changePassword}>
            <div className="form-grid">
              <div className="field full">
                <label htmlFor="currentPassword">Contraseña actual</label>
                <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
              </div>
              <div className="field full">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
                <small>Mínimo 8 caracteres.</small>
              </div>
              <div className="field full">
                <label htmlFor="passwordConfirmation">Confirmar nueva contraseña</label>
                <input id="passwordConfirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
              </div>
            </div>
            {passwordError ? <p style={{ color: "var(--danger)" }}>{passwordError}</p> : null}
            <SubmitRow onCancel={() => setPasswordOpen(false)} submitLabel="Actualizar contraseña" />
          </form>
        )}
      </Modal>
    </aside>
  );
}
