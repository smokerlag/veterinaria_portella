"use client";

import { FormEvent, useEffect, useState } from "react";
import { ModalForm, SubmitRow, apiJson } from "@/components/ui";
import type { Cliente } from "@/lib/types";
import { ESPECIES, labelEspecie } from "@/lib/types";
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
  const [petError, setPetError] = useState("");

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

  async function onSubmitMascota(
    e: FormEvent<HTMLFormElement>,
    clienteId: number,
    close: () => void
  ) {
    e.preventDefault();
    setPetError("");
    const fd = new FormData(e.currentTarget);
    const peso = String(fd.get("peso_kg") || "");
    const payload = {
      cliente_id: clienteId,
      nombre: String(fd.get("nombre") || ""),
      especie: String(fd.get("especie") || "perro"),
      raza: String(fd.get("raza") || ""),
      sexo: String(fd.get("sexo") || "desconocido"),
      fecha_nacimiento: String(fd.get("fecha_nacimiento") || ""),
      color: String(fd.get("color") || ""),
      peso_kg: peso ? Number(peso) : null,
      microchip: String(fd.get("microchip") || ""),
      notas: String(fd.get("notas") || ""),
      activo: 1,
    };

    try {
      await apiJson("/api/mascotas", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      close();
    } catch (err) {
      setPetError(err instanceof Error ? err.message : "No se pudo guardar");
    }
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
                          title={`Nueva mascota · ${c.nombre}`}
                          triggerLabel="Nueva mascota"
                          triggerClassName="btn secondary small"
                          onOpen={() => setPetError("")}
                        >
                          {(close) => (
                            <form
                              key={`pet-${c.id}`}
                              onSubmit={(e) => onSubmitMascota(e, c.id, close)}
                            >
                              <div className="form-grid">
                                <div className="field full">
                                  <label>Dueño</label>
                                  <input value={c.nombre} disabled readOnly />
                                </div>
                                <div className="field">
                                  <label>Nombre</label>
                                  <input name="nombre" required autoFocus />
                                </div>
                                <div className="field">
                                  <label>Especie</label>
                                  <select name="especie" defaultValue="perro">
                                    {ESPECIES.map((esp) => (
                                      <option key={esp} value={esp}>
                                        {labelEspecie(esp)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="field">
                                  <label>Raza</label>
                                  <input name="raza" />
                                </div>
                                <div className="field">
                                  <label>Sexo</label>
                                  <select name="sexo" defaultValue="desconocido">
                                    <option value="macho">Macho</option>
                                    <option value="hembra">Hembra</option>
                                    <option value="desconocido">Desconocido</option>
                                  </select>
                                </div>
                                <div className="field">
                                  <label>Fecha de nacimiento</label>
                                  <input type="date" name="fecha_nacimiento" />
                                </div>
                                <div className="field">
                                  <label>Color</label>
                                  <input name="color" />
                                </div>
                                <div className="field">
                                  <label>Peso (kg)</label>
                                  <input name="peso_kg" type="number" step="0.1" />
                                </div>
                                <div className="field">
                                  <label>Microchip</label>
                                  <input name="microchip" />
                                </div>
                                <div className="field full">
                                  <label>Notas</label>
                                  <textarea name="notas" />
                                </div>
                              </div>
                              {petError ? (
                                <p style={{ color: "var(--danger)" }}>{petError}</p>
                              ) : null}
                              <SubmitRow
                                onCancel={close}
                                submitLabel="Guardar mascota"
                              />
                            </form>
                          )}
                        </ModalForm>
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
