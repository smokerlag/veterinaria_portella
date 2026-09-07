"use client";

import { FormEvent, useEffect, useState } from "react";
import { ModalForm, SubmitRow, apiJson } from "@/components/ui";
import type { Cliente } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const empty = {
  id: 0,
  nombre: "",
  dni: "",
  telefono: "",
  email: "",
  direccion: "",
  notas: "",
};

export default function ClientesPage() {
  const { canDelete } = useAuth();
  const [items, setItems] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(empty);
  const [error, setError] = useState("");

  async function load(search = q) {
    const data = await apiJson<Cliente[]>(
      `/api/clientes${search ? `?q=${encodeURIComponent(search)}` : ""}`
    );
    setItems(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const idValue = String(fd.get("id") || "");
    const payload = {
      id: idValue ? Number(idValue) : undefined,
      nombre: String(fd.get("nombre") || ""),
      dni: String(fd.get("dni") || ""),
      telefono: String(fd.get("telefono") || ""),
      email: String(fd.get("email") || ""),
      direccion: String(fd.get("direccion") || ""),
      notas: String(fd.get("notas") || ""),
    };

    await apiJson("/api/clientes", {
      method: payload.id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    close();
    setEditing(empty);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar cliente y sus mascotas asociadas?")) return;
    await apiJson(`/api/clientes?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p>Base de dueños y datos de contacto</p>
        </div>
        <ModalForm
          title={editing.id ? "Editar cliente" : "Nuevo cliente"}
          triggerLabel="Nuevo cliente"
          onOpen={() => setEditing(empty)}
        >
          {(close) => (
            <form onSubmit={(e) => onSubmit(e, close)}>
              <input type="hidden" name="id" value={editing.id || ""} />
              <div className="form-grid">
                <div className="field">
                  <label>Nombre</label>
                  <input name="nombre" required defaultValue={editing.nombre} />
                </div>
                <div className="field">
                  <label>DNI</label>
                  <input name="dni" defaultValue={editing.dni} />
                </div>
                <div className="field">
                  <label>Teléfono</label>
                  <input name="telefono" defaultValue={editing.telefono} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input name="email" type="email" defaultValue={editing.email} />
                </div>
                <div className="field full">
                  <label>Dirección</label>
                  <input name="direccion" defaultValue={editing.direccion} />
                </div>
                <div className="field full">
                  <label>Notas</label>
                  <textarea name="notas" defaultValue={editing.notas} />
                </div>
              </div>
              <SubmitRow onCancel={close} />
            </form>
          )}
        </ModalForm>
      </div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Buscar por nombre, DNI, teléfono o email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
        />
        <button type="button" className="btn secondary" onClick={() => load()}>
          Buscar
        </button>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <section className="panel">
        <div className="table-wrap">
          {items.length === 0 ? (
            <div className="empty">No hay clientes registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td>{c.dni || "—"}</td>
                    <td>{c.telefono || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>{c.direccion || "—"}</td>
                    <td>
                      <div className="actions">
                        <ModalForm
                          title="Editar cliente"
                          triggerLabel="Editar"
                          triggerClassName="btn secondary small"
                          onOpen={() =>
                            setEditing({
                              id: c.id,
                              nombre: c.nombre,
                              dni: c.dni || "",
                              telefono: c.telefono || "",
                              email: c.email || "",
                              direccion: c.direccion || "",
                              notas: c.notas || "",
                            })
                          }
                        >
                          {(close) => (
                            <form key={c.id} onSubmit={(e) => onSubmit(e, close)}>
                              <input type="hidden" name="id" value={c.id} />
                              <div className="form-grid">
                                <div className="field">
                                  <label>Nombre</label>
                                  <input
                                    name="nombre"
                                    required
                                    defaultValue={c.nombre}
                                  />
                                </div>
                                <div className="field">
                                  <label>DNI</label>
                                  <input name="dni" defaultValue={c.dni || ""} />
                                </div>
                                <div className="field">
                                  <label>Teléfono</label>
                                  <input
                                    name="telefono"
                                    defaultValue={c.telefono || ""}
                                  />
                                </div>
                                <div className="field">
                                  <label>Email</label>
                                  <input
                                    name="email"
                                    type="email"
                                    defaultValue={c.email || ""}
                                  />
                                </div>
                                <div className="field full">
                                  <label>Dirección</label>
                                  <input
                                    name="direccion"
                                    defaultValue={c.direccion || ""}
                                  />
                                </div>
                                <div className="field full">
                                  <label>Notas</label>
                                  <textarea
                                    name="notas"
                                    defaultValue={c.notas || ""}
                                  />
                                </div>
                              </div>
                              <SubmitRow onCancel={close} />
                            </form>
                          )}
                        </ModalForm>
                        {canDelete ? (
                          <button
                            type="button"
                            className="btn danger small"
                            onClick={() => remove(c.id)}
                          >
                            Eliminar
                          </button>
                        ) : null}
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
