"use client";

import { FormEvent, useEffect, useState } from "react";
import { ModalForm, SubmitRow, apiJson } from "@/components/ui";
import { ROLE_LABELS, type UserRole } from "@/lib/auth-shared";

type Usuario = {
  id: number;
  username: string;
  nombre: string;
  rol: UserRole;
  activo: number;
  creado_en: string;
};

const empty = {
  id: 0,
  username: "",
  nombre: "",
  rol: "asistente" as UserRole,
  activo: 1,
  password: "",
};

export default function UsuariosPage() {
  const [items, setItems] = useState<Usuario[]>([]);
  const [editing, setEditing] = useState(empty);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    setError("");
    const res = await fetch("/api/usuarios");
    if (res.status === 403) {
      setForbidden(true);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudieron cargar usuarios");
      return;
    }
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const idValue = String(fd.get("id") || "");
    const password = String(fd.get("password") || "");
    const payload = {
      id: idValue ? Number(idValue) : undefined,
      username: String(fd.get("username") || ""),
      nombre: String(fd.get("nombre") || ""),
      rol: String(fd.get("rol") || "asistente"),
      activo: Number(fd.get("activo") || 1),
      password: password || undefined,
    };

    if (!payload.id && !password) {
      setError("La contraseña es obligatoria para usuarios nuevos");
      return;
    }

    await apiJson("/api/usuarios", {
      method: payload.id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    close();
    setEditing(empty);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar este usuario?")) return;
    await apiJson(`/api/usuarios?id=${id}`, { method: "DELETE" });
    await load();
  }

  if (forbidden) {
    return (
      <div className="page-header">
        <div>
          <h2>Usuarios</h2>
          <p>Solo el administrador puede gestionar cuentas.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Usuarios</h2>
          <p>Administrador, veterinarios y asistentes</p>
        </div>
        <ModalForm
          title="Nuevo usuario"
          triggerLabel="Nuevo usuario"
          onOpen={() => {
            setError("");
            setEditing(empty);
          }}
        >
          {(close) => (
            <form onSubmit={(e) => onSubmit(e, close)}>
              <input type="hidden" name="id" value="" />
              <div className="form-grid">
                <div className="field">
                  <label>Usuario</label>
                  <input name="username" required defaultValue={editing.username} />
                </div>
                <div className="field">
                  <label>Nombre</label>
                  <input name="nombre" required defaultValue={editing.nombre} />
                </div>
                <div className="field">
                  <label>Rol</label>
                  <select name="rol" defaultValue={editing.rol}>
                    <option value="admin">Administrador</option>
                    <option value="veterinario">Veterinario</option>
                    <option value="asistente">Asistente</option>
                  </select>
                </div>
                <div className="field">
                  <label>Contraseña</label>
                  <input name="password" type="password" required />
                </div>
              </div>
              <SubmitRow onCancel={close} />
            </form>
          )}
        </ModalForm>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <section className="panel">
        <div className="table-wrap">
          {items.length === 0 ? (
            <div className="empty">No hay usuarios.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>@{u.username}</td>
                    <td>{u.nombre}</td>
                    <td>
                      <span className="badge">{ROLE_LABELS[u.rol]}</span>
                    </td>
                    <td>
                      {u.activo ? (
                        <span className="badge hecho">activo</span>
                      ) : (
                        <span className="badge cancelada">inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <ModalForm
                          title="Editar usuario"
                          triggerLabel="Editar"
                          triggerClassName="btn secondary small"
                          onOpen={() =>
                            setEditing({
                              id: u.id,
                              username: u.username,
                              nombre: u.nombre,
                              rol: u.rol,
                              activo: u.activo,
                              password: "",
                            })
                          }
                        >
                          {(close) => (
                            <form key={u.id} onSubmit={(e) => onSubmit(e, close)}>
                              <input type="hidden" name="id" value={u.id} />
                              <div className="form-grid">
                                <div className="field">
                                  <label>Usuario</label>
                                  <input
                                    name="username"
                                    required
                                    defaultValue={u.username}
                                  />
                                </div>
                                <div className="field">
                                  <label>Nombre</label>
                                  <input
                                    name="nombre"
                                    required
                                    defaultValue={u.nombre}
                                  />
                                </div>
                                <div className="field">
                                  <label>Rol</label>
                                  <select name="rol" defaultValue={u.rol}>
                                    <option value="admin">Administrador</option>
                                    <option value="veterinario">Veterinario</option>
                                    <option value="asistente">Asistente</option>
                                  </select>
                                </div>
                                <div className="field">
                                  <label>Estado</label>
                                  <select name="activo" defaultValue={u.activo}>
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                  </select>
                                </div>
                                <div className="field full">
                                  <label>Nueva contraseña (opcional)</label>
                                  <input name="password" type="password" />
                                </div>
                              </div>
                              <SubmitRow onCancel={close} />
                            </form>
                          )}
                        </ModalForm>
                        <button
                          type="button"
                          className="btn danger small"
                          onClick={() => remove(u.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
