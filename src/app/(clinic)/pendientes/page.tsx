"use client";

import { FormEvent, useEffect, useState } from "react";
import { ModalForm, SubmitRow, apiJson } from "@/components/ui";
import type { Cliente, Mascota, Pendiente } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const empty = {
  id: 0,
  titulo: "",
  descripcion: "",
  fecha_limite: "",
  prioridad: "media",
  estado: "pendiente",
  mascota_id: "",
  cliente_id: "",
};

export default function PendientesPage() {
  const { canDelete } = useAuth();
  const [items, setItems] = useState<Pendiente[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [editing, setEditing] = useState(empty);

  async function load(all = showDone) {
    const [p, c, m] = await Promise.all([
      apiJson<Pendiente[]>(`/api/pendientes${all ? "?all=1" : ""}`),
      apiJson<Cliente[]>("/api/clientes"),
      apiJson<Mascota[]>("/api/mascotas"),
    ]);
    setItems(p);
    setClientes(c);
    setMascotas(m);
  }

  useEffect(() => {
    load();
  }, [showDone]);

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: editing.id || undefined,
      titulo: String(fd.get("titulo") || ""),
      descripcion: String(fd.get("descripcion") || ""),
      fecha_limite: String(fd.get("fecha_limite") || ""),
      prioridad: String(fd.get("prioridad") || "media"),
      estado: String(fd.get("estado") || "pendiente"),
      mascota_id: fd.get("mascota_id") ? Number(fd.get("mascota_id")) : null,
      cliente_id: fd.get("cliente_id") ? Number(fd.get("cliente_id")) : null,
    };
    await apiJson("/api/pendientes", {
      method: editing.id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    close();
    setEditing(empty);
    await load();
  }

  async function markDone(p: Pendiente) {
    await apiJson("/api/pendientes", {
      method: "PUT",
      body: JSON.stringify({
        ...p,
        estado: "hecho",
      }),
    });
    await load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar pendiente?")) return;
    await apiJson(`/api/pendientes?id=${id}`, { method: "DELETE" });
    await load();
  }

  function FormFields() {
    return (
      <div className="form-grid">
        <div className="field full">
          <label>Título</label>
          <input name="titulo" required defaultValue={editing.titulo} />
        </div>
        <div className="field full">
          <label>Descripción</label>
          <textarea name="descripcion" defaultValue={editing.descripcion} />
        </div>
        <div className="field">
          <label>Fecha límite</label>
          <input
            type="date"
            name="fecha_limite"
            defaultValue={editing.fecha_limite}
          />
        </div>
        <div className="field">
          <label>Prioridad</label>
          <select name="prioridad" defaultValue={editing.prioridad}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div className="field">
          <label>Estado</label>
          <select name="estado" defaultValue={editing.estado}>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="hecho">Hecho</option>
          </select>
        </div>
        <div className="field">
          <label>Cliente (opcional)</label>
          <select name="cliente_id" defaultValue={editing.cliente_id}>
            <option value="">—</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Mascota (opcional)</label>
          <select name="mascota_id" defaultValue={editing.mascota_id}>
            <option value="">—</option>
            {mascotas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} · {m.cliente_nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Pendientes</h2>
          <p>Tareas, seguimientos y recordatorios de la clínica</p>
        </div>
        <ModalForm
          title="Nuevo pendiente"
          triggerLabel="Nuevo pendiente"
          onOpen={() => setEditing(empty)}
        >
          {(close) => (
            <form onSubmit={(e) => onSubmit(e, close)}>
              <FormFields />
              <SubmitRow onCancel={close} />
            </form>
          )}
        </ModalForm>
      </div>

      <div className="toolbar">
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />
          Mostrar también los hechos
        </label>
      </div>

      <section className="panel">
        <div className="panel-body stack">
          {items.length === 0 ? (
            <div className="empty">No hay pendientes.</div>
          ) : (
            items.map((p) => (
              <div className="list-item" key={p.id}>
                <div className="actions" style={{ justifyContent: "space-between" }}>
                  <h4>{p.titulo}</h4>
                  <div className="actions">
                    <span className={`badge ${p.prioridad}`}>{p.prioridad}</span>
                    <span className={`badge ${p.estado}`}>{p.estado}</span>
                  </div>
                </div>
                {p.descripcion ? <p>{p.descripcion}</p> : null}
                <p style={{ marginTop: 6 }}>
                  {p.fecha_limite ? `Límite: ${p.fecha_limite}` : "Sin fecha límite"}
                  {p.cliente_nombre ? ` · ${p.cliente_nombre}` : ""}
                  {p.mascota_nombre ? ` · ${p.mascota_nombre}` : ""}
                </p>
                <div className="actions" style={{ marginTop: 8 }}>
                  {p.estado !== "hecho" ? (
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => markDone(p)}
                    >
                      Marcar hecho
                    </button>
                  ) : null}
                  <ModalForm
                    title="Editar pendiente"
                    triggerLabel="Editar"
                    onOpen={() =>
                      setEditing({
                        id: p.id,
                        titulo: p.titulo,
                        descripcion: p.descripcion || "",
                        fecha_limite: p.fecha_limite || "",
                        prioridad: p.prioridad,
                        estado: p.estado,
                        mascota_id: p.mascota_id?.toString() || "",
                        cliente_id: p.cliente_id?.toString() || "",
                      })
                    }
                  >
                    {(close) => (
                      <form onSubmit={(e) => onSubmit(e, close)}>
                        <FormFields />
                        <SubmitRow onCancel={close} />
                      </form>
                    )}
                  </ModalForm>
                  {canDelete ? (
                    <button
                      type="button"
                      className="btn danger small"
                      onClick={() => remove(p.id)}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
