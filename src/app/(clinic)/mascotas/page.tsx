"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal, ModalForm, SubmitRow, apiJson, onDigitsOnly } from "@/components/ui";
import type { Cliente, Mascota } from "@/lib/types";
import { ESPECIES, labelEspecie, labelSexo } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { validateClienteFields } from "@/lib/validation";
import { useRouter } from "next/navigation";

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
  importante: "",
  activo: 1,
};

function ownerLabel(c: Cliente) {
  return `${c.nombre}${c.dni ? ` · DNI ${c.dni}` : ""}`;
}

export default function MascotasPage() {
  const { canDelete, canWriteHistorial } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [clienteIdFilter, setClienteIdFilter] = useState("");
  const [editing, setEditing] = useState(empty);
  const [ownerId, setOwnerId] = useState("");
  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerListOpen, setOwnerListOpen] = useState(false);
  const [newClienteOpen, setNewClienteOpen] = useState(false);
  const [clienteError, setClienteError] = useState("");

  async function load(search = q, selectedClienteId = clienteIdFilter) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedClienteId) params.set("clienteId", selectedClienteId);
    const [mascotas, owners] = await Promise.all([
      apiJson<Mascota[]>(`/api/mascotas${params.size ? `?${params}` : ""}`),
      apiJson<Cliente[]>("/api/clientes"),
    ]);
    setItems(mascotas);
    setClientes(owners);
  }

  useEffect(() => {
    const selectedClienteId =
      new URLSearchParams(window.location.search).get("clienteId") || "";
    setClienteIdFilter(selectedClienteId);
    load(q, selectedClienteId);
  }, []);

  function openPetForm(data = empty) {
    setEditing(data);
    const id = data.cliente_id ? String(data.cliente_id) : "";
    setOwnerId(id);
    const owner = clientes.find((c) => c.id === data.cliente_id);
    setOwnerQuery(owner ? ownerLabel(owner) : "");
    setOwnerListOpen(false);
    setClienteError("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    if (!ownerId) {
      setClienteError("Selecciona un dueño o crea uno nuevo");
      setOwnerListOpen(true);
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
      importante: String(fd.get("importante") || ""),
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

  function selectOwner(c: Cliente) {
    setOwnerId(String(c.id));
    setOwnerQuery(ownerLabel(c));
    setOwnerListOpen(false);
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
    const invalid = validateClienteFields(payload);
    if (invalid) {
      setClienteError(invalid);
      return;
    }

    try {
      const created = await apiJson<{ id: number }>("/api/clientes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const owners = await apiJson<Cliente[]>("/api/clientes");
      setClientes(owners);
      const nuevo = owners.find((c) => c.id === created.id);
      setOwnerId(String(created.id));
      setOwnerQuery(nuevo ? ownerLabel(nuevo) : payload.nombre);
      setOwnerListOpen(false);
      setNewClienteOpen(false);
    } catch (err) {
      setClienteError(
        err instanceof Error ? err.message : "No se pudo guardar el cliente"
      );
    }
  }

  const ownerFilter = ownerQuery.trim().toLowerCase();
  const selectedClient = clientes.find(
    (cliente) => String(cliente.id) === clienteIdFilter
  );
  const filteredOwners = clientes
    .filter((c) => {
      if (!ownerFilter) return true;
      const blob = [c.nombre, c.dni, c.telefono, c.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(ownerFilter);
    })
    .slice(0, 12);

  const formFields = (
      <div className="form-grid">
        <div className="field">
          <label>Nombre</label>
          <input name="nombre" required defaultValue={editing.nombre} />
        </div>
        <div className="field">
          <label>Dueño</label>
          <div className="owner-picker">
            <div className="actions" style={{ alignItems: "stretch" }}>
              <input
                type="search"
                placeholder="Buscar por nombre, DNI o teléfono…"
                value={ownerQuery}
                onChange={(e) => {
                  setOwnerQuery(e.target.value);
                  setOwnerId("");
                  setOwnerListOpen(true);
                  setClienteError("");
                }}
                onFocus={() => setOwnerListOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setOwnerListOpen(false), 150);
                }}
                autoComplete="off"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn secondary small"
                onClick={() => setNewClienteOpen(true)}
              >
                Nuevo
              </button>
            </div>
            {ownerId ? (
              <small className="owner-selected">
                Seleccionado:{" "}
                {clientes.find((c) => String(c.id) === ownerId)?.nombre ||
                  ownerQuery}
              </small>
            ) : null}
            {ownerListOpen ? (
              <ul className="owner-results" role="listbox">
                {filteredOwners.length === 0 ? (
                  <li className="owner-empty">Sin resultados</li>
                ) : (
                  filteredOwners.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectOwner(c)}
                      >
                        <strong>{c.nombre}</strong>
                        <span>
                          {[
                            c.dni ? `DNI ${c.dni}` : "",
                            c.telefono || "",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Sin datos de contacto"}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
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
                {labelEspecie(e)}
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
          <label>Importante</label>
          <textarea
            name="importante"
            rows={2}
            placeholder="Alergias, enfermedades, cuidados especiales..."
            defaultValue={editing.importante}
          />
        </div>
        <div className="field full">
          <label>Notas</label>
          <textarea name="notas" defaultValue={editing.notas} />
        </div>
      </div>
  );

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
            <label>DNI (8 dígitos)</label>
            <input
              name="dni"
              required
              inputMode="numeric"
              pattern="\d{8}"
              maxLength={8}
              placeholder="12345678"
              title="Exactamente 8 dígitos"
              onInput={(e) => onDigitsOnly(e, 8)}
            />
          </div>
          <div className="field">
            <label>Celular (9 dígitos)</label>
            <input
              name="telefono"
              required
              inputMode="numeric"
              pattern="\d{9}"
              maxLength={9}
              placeholder="987654321"
              title="Exactamente 9 dígitos"
              onInput={(e) => onDigitsOnly(e, 9)}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="nombre@dominio.com"
              pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
              title="Formato de correo: nombre@dominio.com"
            />
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
          <h2>{selectedClient ? `Mascotas de ${selectedClient.nombre}` : "Mascotas"}</h2>
          <p>
            {selectedClient
              ? `Cliente${selectedClient.dni ? ` · DNI ${selectedClient.dni}` : ""}`
              : "Pacientes vinculados a cada cliente"}
          </p>
        </div>
        <ModalForm
          title="Nueva mascota"
          triggerLabel="Nueva mascota"
          onOpen={() => openPetForm(empty)}
        >
          {(close) => (
            <>
              <form onSubmit={(e) => onSubmit(e, close)}>
                {formFields}
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
        {selectedClient ? (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setClienteIdFilter("");
              router.replace("/mascotas");
              load(q, "");
            }}
          >
            Ver todas
          </button>
        ) : null}
      </div>

      <section className="panel">
        <div className="table-wrap">
          {items.length === 0 ? (
            <div className="empty">
              {selectedClient
                ? "Este cliente no tiene mascotas registradas."
                : "No hay mascotas registradas."}
            </div>
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
                      <div className="pet-name-line">
                        {m.nombre}
                        {m.importante?.trim() ? (
                          <span
                            className="pet-important-indicator"
                            role="img"
                            aria-label={`Importante: ${m.importante}`}
                            data-tooltip={m.importante}
                            tabIndex={0}
                          >
                            !
                          </span>
                        ) : null}
                      </div>
                      {!m.activo ? (
                        <div>
                          <span className="badge cancelada">inactiva</span>
                        </div>
                      ) : null}
                    </td>
                    <td>{m.cliente_nombre}</td>
                    <td>
                      {labelEspecie(m.especie)}
                      {m.raza ? ` · ${m.raza}` : ""}
                    </td>
                    <td>{labelSexo(m.sexo)}</td>
                    <td>{m.peso_kg != null ? `${m.peso_kg} kg` : "—"}</td>
                    <td>
                      <div className="actions">
                        {canWriteHistorial ? (
                          <button
                            type="button"
                            className="btn small"
                            onClick={() =>
                              router.push(`/historial?mascotaId=${m.id}&nuevo=1`)
                            }
                          >
                            Agregar registro
                          </button>
                        ) : null}
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
                              importante: m.importante || "",
                              activo: m.activo,
                            })
                          }
                        >
                          {(close) => (
                            <>
                              <form onSubmit={(e) => onSubmit(e, close)}>
                                {formFields}
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
