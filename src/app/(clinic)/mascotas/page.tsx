"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal, ModalForm, SubmitRow, apiJson } from "@/components/ui";
import type { Cliente, Mascota } from "@/lib/types";
import { ESPECIES } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const empty = {
  id: 0,
  cliente_id: 0,
  nombre: "",
  especie: "perro",
  raza: "",
  sexo: "desconocido",
  fecha_nacimiento: "",
  color: "",
  peso_kg: "",
  microchip: "",
  notas: "",
  activo: 1,
};

const NUEVO_CLIENTE = "__nuevo_cliente__";

export default function MascotasPage() {
  const { canDelete } = useAuth();
  const [items, setItems] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(empty);
  const [ownerId, setOwnerId] = useState("");
  const [newClienteOpen, setNewClienteOpen] = useState(false);
  const [clienteError, setClienteError] = useState("");

  async function load(search = q) {
    const [mascotas, owners] = await Promise.all([
      apiJson<Mascota[]>(
        `/api/mascotas${search ? `?q=${encodeURIComponent(search)}` : ""}`
      ),
      apiJson<Cliente[]>("/api/clientes"),
    ]);
    setItems(mascotas);
    setClientes(owners);
  }

  useEffect(() => {
    load();
  }, []);

  function openPetForm(data = empty) {
    setEditing(data);
    setOwnerId(data.cliente_id ? String(data.cliente_id) : "");
    setClienteError("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    if (!ownerId || ownerId === NUEVO_CLIENTE) {
      setClienteError("Selecciona un dueño o crea uno nuevo");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const peso = String(fd.get("peso_kg") || "");
    const payload = {
      id: editing.id || undefined,
      cliente_id: Number(ownerId),
      nombre: String(fd.get("nombre") || ""),
      especie: String(fd.get("especie") || "perro"),
      raza: String(fd.get("raza") || ""),
      sexo: String(fd.get("sexo") || "desconocido"),
      fecha_nacimiento: String(fd.get("fecha_nacimiento") || ""),
      color: String(fd.get("color") || ""),
      peso_kg: peso ? Number(peso) : null,
      microchip: String(fd.get("microchip") || ""),
      notas: String(fd.get("notas") || ""),
      activo: Number(fd.get("activo") || 1),
    };

    await apiJson("/api/mascotas", {
      method: editing.id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    close();
    openPetForm(empty);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar mascota, citas e historial asociados?")) return;
    await apiJson(`/api/mascotas?id=${id}`, { method: "DELETE" });
    await load();
  }

  function onOwnerChange(value: string) {
    if (value === NUEVO_CLIENTE) {
      setNewClienteOpen(true);
      return;
    }
    setOwnerId(value);
    setClienteError("");
  }

  async function createCliente(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClienteError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      nombre: String(fd.get("nombre") || ""),
      dni: String(fd.get("dni") || ""),
      telefono: String(fd.get("telefono") || ""),
      email: String(fd.get("email") || ""),
      direccion: String(fd.get("direccion") || ""),
      notas: String(fd.get("notas") || ""),
    };
    if (!payload.nombre.trim()) {
      setClienteError("El nombre del cliente es obligatorio");
      return;
    }

    const created = await apiJson<{ id: number }>("/api/clientes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const owners = await apiJson<Cliente[]>("/api/clientes");
    setClientes(owners);
    setOwnerId(String(created.id));
    setNewClienteOpen(false);
  }

  function FormFields() {
    return (
      <div className="form-grid">
        <div className="field">
          <label>Nombre</label>
          <input name="nombre" required defaultValue={editing.nombre} />
        </div>
        <div className="field">
          <label>Dueño</label>
          <div className="actions" style={{ alignItems: "stretch" }}>
            <select
              name="cliente_id"
              required
              value={ownerId}
              onChange={(e) => onOwnerChange(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="" disabled>
                Seleccionar dueño
              </option>
              <option value={NUEVO_CLIENTE}>＋ Nuevo cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.dni ? ` · DNI ${c.dni}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn secondary small"
              onClick={() => setNewClienteOpen(true)}
            >
              Nuevo
            </button>
          </div>
          {clienteError ? (
            <small style={{ color: "var(--danger)" }}>{clienteError}</small>
          ) : null}
        </div>
        <div className="field">
          <label>Especie</label>
          <select name="especie" defaultValue={editing.especie}>
            {ESPECIES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Raza</label>
          <input name="raza" defaultValue={editing.raza} />
        </div>
        <div className="field">
          <label>Sexo</label>
          <select name="sexo" defaultValue={editing.sexo}>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
            <option value="desconocido">Desconocido</option>
          </select>
        </div>
        <div className="field">
          <label>Fecha de nacimiento</label>
          <input
            type="date"
            name="fecha_nacimiento"
            defaultValue={editing.fecha_nacimiento}
          />
        </div>
        <div className="field">
          <label>Color</label>
          <input name="color" defaultValue={editing.color} />
        </div>
        <div className="field">
          <label>Peso (kg)</label>
          <input
            name="peso_kg"
            type="number"
            step="0.1"
            defaultValue={editing.peso_kg}
          />
        </div>
        <div className="field">
          <label>Microchip</label>
          <input name="microchip" defaultValue={editing.microchip} />
        </div>
        {editing.id ? (
          <div className="field">
            <label>Estado</label>
            <select name="activo" defaultValue={editing.activo}>
              <option value={1}>Activa</option>
              <option value={0}>Inactiva</option>
            </select>
          </div>
        ) : null}
        <div className="field full">
          <label>Notas</label>
          <textarea name="notas" defaultValue={editing.notas} />
        </div>
      </div>
    );
  }

  const nuevoClienteModal = (
    <Modal
      open={newClienteOpen}
      nested
      title="Nuevo cliente (dueño)"
      onClose={() => setNewClienteOpen(false)}
    >
      <form onSubmit={createCliente}>
        <div className="form-grid">
          <div className="field">
            <label>Nombre</label>
            <input name="nombre" required autoFocus />
          </div>
          <div className="field">
            <label>DNI</label>
            <input name="dni" />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input name="telefono" />
          </div>
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" />
          </div>
          <div className="field full">
            <label>Dirección</label>
            <input name="direccion" />
          </div>
          <div className="field full">
            <label>Notas</label>
            <textarea name="notas" />
          </div>
        </div>
        {clienteError ? (
          <p style={{ color: "var(--danger)" }}>{clienteError}</p>
        ) : null}
        <SubmitRow
          onCancel={() => setNewClienteOpen(false)}
          submitLabel="Guardar cliente"
        />
      </form>
    </Modal>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Mascotas</h2>
          <p>Pacientes vinculados a cada cliente</p>
        </div>
        <ModalForm
          title="Nueva mascota"
          triggerLabel="Nueva mascota"
          onOpen={() => openPetForm(empty)}
        >
          {(close) => (
            <>
              <form onSubmit={(e) => onSubmit(e, close)}>
                <FormFields />
                <SubmitRow onCancel={close} />
              </form>
              {nuevoClienteModal}
            </>
          )}
        </ModalForm>
      </div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Buscar mascota, raza o dueño"
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

      <section className="panel">
        <div className="table-wrap">
          {items.length === 0 ? (
            <div className="empty">No hay mascotas registradas.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Dueño</th>
                  <th>Especie / raza</th>
                  <th>Sexo</th>
                  <th>Peso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.nombre}
                      {!m.activo ? (
                        <div>
                          <span className="badge cancelada">inactiva</span>
                        </div>
                      ) : null}
                    </td>
                    <td>{m.cliente_nombre}</td>
                    <td>
                      {m.especie}
                      {m.raza ? ` · ${m.raza}` : ""}
                    </td>
                    <td>{m.sexo}</td>
                    <td>{m.peso_kg != null ? `${m.peso_kg} kg` : "—"}</td>
                    <td>
                      <div className="actions">
                        <ModalForm
                          title="Editar mascota"
                          triggerLabel="Editar"
                          triggerClassName="btn secondary small"
                          onOpen={() =>
                            openPetForm({
                              id: m.id,
                              cliente_id: m.cliente_id,
                              nombre: m.nombre,
                              especie: m.especie,
                              raza: m.raza || "",
                              sexo: m.sexo,
                              fecha_nacimiento: m.fecha_nacimiento || "",
                              color: m.color || "",
                              peso_kg: m.peso_kg?.toString() || "",
                              microchip: m.microchip || "",
                              notas: m.notas || "",
                              activo: m.activo,
                            })
                          }
                        >
                          {(close) => (
                            <>
                              <form onSubmit={(e) => onSubmit(e, close)}>
                                <FormFields />
                                <SubmitRow onCancel={close} />
                              </form>
                              {nuevoClienteModal}
                            </>
                          )}
                        </ModalForm>
                        {canDelete ? (
                          <button
                            type="button"
                            className="btn danger small"
                            onClick={() => remove(m.id)}
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
