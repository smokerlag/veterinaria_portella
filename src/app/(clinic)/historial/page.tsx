"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal, ModalForm, SubmitRow, apiJson } from "@/components/ui";
import type { Historial, Mascota } from "@/lib/types";
import {
  TIPOS_HISTORIAL,
  PRONOSTICOS,
  labelPronostico,
  parsePronosticos,
} from "@/lib/types";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

function numOrEmpty(v: FormDataEntryValue | null) {
  const s = String(v || "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="detail-block">
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}

export default function HistorialPage() {
  const { user, canWriteHistorial } = useAuth();
  const [items, setItems] = useState<Historial[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaId, setMascotaId] = useState("");
  const [viewing, setViewing] = useState<Historial | null>(null);

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
    const pronostico = PRONOSTICOS.map((p) => p.value).filter(
      (value) => fd.get(`pronostico_${value}`) === "on"
    );

    await apiJson("/api/historial", {
      method: "POST",
      body: JSON.stringify({
        mascota_id: Number(fd.get("mascota_id")),
        fecha: String(fd.get("fecha")),
        tipo: String(fd.get("tipo")),
        motivo_consulta: String(fd.get("motivo_consulta") || ""),
        anamnesis: String(fd.get("anamnesis") || ""),
        temperatura_c: numOrEmpty(fd.get("temperatura_c")),
        fc_lpm: numOrEmpty(fd.get("fc_lpm")),
        fr_rpm: numOrEmpty(fd.get("fr_rpm")),
        estado_hidratacion: String(fd.get("estado_hidratacion") || ""),
        mucosas: String(fd.get("mucosas") || ""),
        tllc_seg: numOrEmpty(fd.get("tllc_seg")),
        condicion_corporal: String(fd.get("condicion_corporal") || ""),
        hallazgos: String(fd.get("hallazgos") || ""),
        examenes_complementarios: String(
          fd.get("examenes_complementarios") || ""
        ),
        diagnostico: String(fd.get("diagnostico") || ""),
        tratamiento: String(fd.get("tratamiento") || ""),
        evolucion_observaciones: String(
          fd.get("evolucion_observaciones") || ""
        ),
        pronostico,
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

  const firma = user?.nombre || "—";

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Historial clínico</h2>
          <p>
            {canWriteHistorial
              ? "Consulta clínica completa y seguimiento"
              : "Solo lectura · los registros los cargan veterinarios"}
          </p>
        </div>
        {canWriteHistorial ? (
          <ModalForm title="Nuevo registro clínico" triggerLabel="Nuevo registro">
            {(close) => (
              <form className="clinical-form" onSubmit={(e) => onSubmit(e, close)}>
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
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <section className="form-section">
                  <h4>Motivo de consulta</h4>
                  <div className="field full">
                    <textarea name="motivo_consulta" required rows={2} />
                  </div>
                </section>

                <section className="form-section">
                  <h4>Antecedentes clínicos (anamnesis)</h4>
                  <div className="field full">
                    <textarea name="anamnesis" rows={3} />
                  </div>
                </section>

                <section className="form-section">
                  <h4>Exploración física</h4>
                  <div className="form-grid">
                    <div className="field">
                      <label>Temperatura (°C)</label>
                      <input name="temperatura_c" type="number" step="0.1" />
                    </div>
                    <div className="field">
                      <label>FC (lpm)</label>
                      <input name="fc_lpm" type="number" step="1" />
                    </div>
                    <div className="field">
                      <label>FR (rpm)</label>
                      <input name="fr_rpm" type="number" step="1" />
                    </div>
                    <div className="field">
                      <label>TLLC (seg)</label>
                      <input name="tllc_seg" type="number" step="0.1" />
                    </div>
                    <div className="field">
                      <label>Estado de hidratación</label>
                      <input name="estado_hidratacion" />
                    </div>
                    <div className="field">
                      <label>Mucosas</label>
                      <input name="mucosas" />
                    </div>
                    <div className="field full">
                      <label>Condición corporal</label>
                      <input name="condicion_corporal" />
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h4>Hallazgos clínicos relevantes</h4>
                  <div className="field full">
                    <textarea name="hallazgos" rows={3} />
                  </div>
                </section>

                <section className="form-section">
                  <h4>Exámenes complementarios</h4>
                  <p className="form-hint">
                    Laboratorio, radiografías, ecografía, etc.
                  </p>
                  <div className="field full">
                    <textarea name="examenes_complementarios" rows={3} />
                  </div>
                </section>

                <section className="form-section">
                  <h4>Diagnóstico presuntivo / definitivo</h4>
                  <div className="field full">
                    <textarea name="diagnostico" rows={3} />
                  </div>
                </section>

                <section className="form-section">
                  <h4>Plan terapéutico / tratamiento indicado</h4>
                  <div className="field full">
                    <textarea name="tratamiento" rows={3} />
                  </div>
                </section>

                <section className="form-section">
                  <h4>Evolución y observaciones</h4>
                  <div className="field full">
                    <textarea name="evolucion_observaciones" rows={3} />
                  </div>
                </section>

                <section className="form-section">
                  <h4>Pronóstico del paciente</h4>
                  <div className="check-grid">
                    {PRONOSTICOS.map((p) => (
                      <label key={p.value} className="check-item">
                        <input type="checkbox" name={`pronostico_${p.value}`} />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="form-section">
                  <h4>Firma del veterinario</h4>
                  <div className="firma-box">
                    <span>{firma}</span>
                    <small>Según la cuenta iniciada · no editable</small>
                  </div>
                </section>

                <SubmitRow onCancel={close} submitLabel="Guardar registro" />
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
        <button
          type="button"
          className="btn secondary"
          onClick={() => load(mascotaId)}
        >
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
                  <th>Motivo</th>
                  <th>Diagnóstico</th>
                  <th>Pronóstico</th>
                  <th>Firma</th>
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
                    <td>{h.motivo_consulta || "—"}</td>
                    <td>{h.diagnostico || "—"}</td>
                    <td>
                      {parsePronosticos(h.pronostico).length
                        ? parsePronosticos(h.pronostico)
                            .map(labelPronostico)
                            .join(", ")
                        : "—"}
                    </td>
                    <td>{h.veterinario || "—"}</td>
                    <td>
                      <div className="actions">
                        <button
                          type="button"
                          className="btn secondary small"
                          onClick={() => setViewing(h)}
                        >
                          Ver
                        </button>
                        {canWriteHistorial ? (
                          <button
                            type="button"
                            className="btn danger small"
                            onClick={() => remove(h.id)}
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

      <Modal
        open={!!viewing}
        title="Detalle del registro clínico"
        onClose={() => setViewing(null)}
      >
        {viewing ? (
          <div className="clinical-form clinical-detail">
            <div className="detail-meta">
              <span>
                {viewing.fecha} · {viewing.mascota_nombre} ·{" "}
                {viewing.cliente_nombre}
              </span>
              <span className="badge">{viewing.tipo}</span>
            </div>
            <DetailBlock label="Motivo de consulta" value={viewing.motivo_consulta} />
            <DetailBlock
              label="Antecedentes clínicos (anamnesis)"
              value={viewing.anamnesis}
            />
            <div className="form-section">
              <h4>Exploración física</h4>
              <div className="vitals-grid">
                <span>
                  Temp:{" "}
                  {viewing.temperatura_c != null
                    ? `${viewing.temperatura_c} °C`
                    : "—"}
                </span>
                <span>
                  FC: {viewing.fc_lpm != null ? `${viewing.fc_lpm} lpm` : "—"}
                </span>
                <span>
                  FR: {viewing.fr_rpm != null ? `${viewing.fr_rpm} rpm` : "—"}
                </span>
                <span>
                  TLLC:{" "}
                  {viewing.tllc_seg != null ? `${viewing.tllc_seg} seg` : "—"}
                </span>
                <span>Hidratación: {viewing.estado_hidratacion || "—"}</span>
                <span>Mucosas: {viewing.mucosas || "—"}</span>
                <span>Condición corporal: {viewing.condicion_corporal || "—"}</span>
              </div>
            </div>
            <DetailBlock
              label="Hallazgos clínicos relevantes"
              value={viewing.hallazgos}
            />
            <DetailBlock
              label="Exámenes complementarios"
              value={viewing.examenes_complementarios}
            />
            <DetailBlock
              label="Diagnóstico presuntivo / definitivo"
              value={viewing.diagnostico}
            />
            <DetailBlock
              label="Plan terapéutico / tratamiento indicado"
              value={viewing.tratamiento}
            />
            <DetailBlock
              label="Evolución y observaciones"
              value={viewing.evolucion_observaciones}
            />
            <DetailBlock
              label="Pronóstico"
              value={
                parsePronosticos(viewing.pronostico)
                  .map(labelPronostico)
                  .join(", ") || null
              }
            />
            <div className="firma-box">
              <span>{viewing.veterinario || "—"}</span>
              <small>Firma del veterinario</small>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
