"use client";

import { FormEvent, useEffect, useState } from "react";
import { ModalForm, SubmitRow, apiJson } from "@/components/ui";
import type { Historial, Mascota } from "@/lib/types";
import { TIPOS_HISTORIAL } from "@/lib/types";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function HistorialPage() {
  const { canWriteHistorial } = useAuth();
  const [items, setItems] = useState<Historial[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaId, setMascotaId] = useState("");

  async function load(filter = mascotaId) {
    const [h, m] = await Promise.all([
      apiJson<Historial[]>(
        `/api/historial${filter ? `?mascotaId=${filter}` : ""}`
      ),
      apiJson<Mascota[]>("/api/mascotas"),
    ]);
    setItems(h);
    setMascotas(m);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const peso = String(fd.get("peso_kg") || "");
    const temp = String(fd.get("temperatura_c") || "");
    await apiJson("/api/historial", {
      method: "POST",
      body: JSON.stringify({
        mascota_id: Number(fd.get("mascota_id")),
        fecha: String(fd.get("fecha")),
        tipo: String(fd.get("tipo")),
        diagnostico: String(fd.get("diagnostico") || ""),
        tratamiento: String(fd.get("tratamiento") || ""),
        peso_kg: peso ? Number(peso) : null,
        temperatura_c: temp ? Number(temp) : null,
        notas: String(fd.get("notas") || ""),
        veterinario: String(fd.get("veterinario") || ""),
      }),
    });
    close();
    await load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar este registro clínico?")) return;
    await apiJson(`/api/historial?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Historial clínico</h2>
          <p>
            {canWriteHistorial
              ? "Consultas, vacunas, cirugías y seguimiento"
              : "Solo lectura · los registros los cargan veterinarios"}
          </p>
        </div>
        {canWriteHistorial ? (
        <ModalForm title="Nuevo registro" triggerLabel="Nuevo registro">
          {(close) => (
            <form onSubmit={(e) => onSubmit(e, close)}>
              <div className="form-grid">
                <div className="field full">
                  <label>Mascota</label>
                  <select name="mascota_id" required defaultValue="">
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {mascotas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} · {m.cliente_nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    required
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="field">
                  <label>Tipo</label>
                  <select name="tipo" defaultValue="consulta">
                    {TIPOS_HISTORIAL.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Peso (kg)</label>
                  <input name="peso_kg" type="number" step="0.1" />
                </div>
                <div className="field">
                  <label>Temperatura (°C)</label>
                  <input name="temperatura_c" type="number" step="0.1" />
                </div>
                <div className="field full">
                  <label>Diagnóstico</label>
                  <textarea name="diagnostico" />
                </div>
                <div className="field full">
                  <label>Tratamiento</label>
                  <textarea name="tratamiento" />
                </div>
                <div className="field">
                  <label>Veterinario</label>
                  <input name="veterinario" />
                </div>
                <div className="field full">
                  <label>Notas</label>
                  <textarea name="notas" />
                </div>
              </div>
              <SubmitRow onCancel={close} />
            </form>
          )}
        </ModalForm>
        ) : null}
      </div>

      <div className="toolbar">
        <select
          className="search"
          value={mascotaId}
          onChange={(e) => setMascotaId(e.target.value)}
        >
          <option value="">Todas las mascotas</option>
          {mascotas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} · {m.cliente_nombre}
            </option>
          ))}
        </select>
        <button type="button" className="btn secondary" onClick={() => load(mascotaId)}>
          Filtrar
        </button>
      </div>

      <section className="panel">
        <div className="table-wrap">
          {items.length === 0 ? (
            <div className="empty">Sin registros clínicos.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Mascota</th>
                  <th>Tipo</th>
                  <th>Diagnóstico / tratamiento</th>
                  <th>Signos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => (
                  <tr key={h.id}>
                    <td>{h.fecha}</td>
                    <td>
                      {h.mascota_nombre}
                      <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                        {h.cliente_nombre}
                      </div>
                    </td>
                    <td>
                      <span className="badge">{h.tipo}</span>
                    </td>
                    <td>
                      <div>{h.diagnostico || "—"}</div>
                      <div style={{ color: "var(--muted)", marginTop: 4 }}>
                        {h.tratamiento || ""}
                      </div>
                    </td>
                    <td>
                      {h.peso_kg != null ? `${h.peso_kg} kg` : "—"}
                      {h.temperatura_c != null ? ` · ${h.temperatura_c}°C` : ""}
                    </td>
                    <td>
                      {canWriteHistorial ? (
                        <button
                          type="button"
                          className="btn danger small"
                          onClick={() => remove(h.id)}
                        >
                          Eliminar
                        </button>
                      ) : null}
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
