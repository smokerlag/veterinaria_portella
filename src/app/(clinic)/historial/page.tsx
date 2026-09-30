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
import { useAuth } from "@/hooks/useAuth";

const today = new Date().toISOString().slice(0, 10);

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
  const [mascotaQuery, setMascotaQuery] = useState("");
  const [petListOpen, setPetListOpen] = useState(false);
  const [petError, setPetError] = useState("");
  const [viewing, setViewing] = useState<Historial | null>(null);
  const [autoOpenRecord, setAutoOpenRecord] = useState(false);
  const [otherExamSelected, setOtherExamSelected] = useState(false);

  async function load(filter = mascotaId) {
    const [h, m] = await Promise.all([
      apiJson<Historial[]>(
        `/api/historial${filter ? `?mascotaId=${filter}` : ""}`
      ),
      apiJson<Mascota[]>("/api/mascotas"),
    ]);
    setItems(h);
    setMascotas(m);
    const selectedPet = m.find((pet) => String(pet.id) === filter);
    if (selectedPet) {
      setMascotaQuery(`${selectedPet.nombre} · ${selectedPet.cliente_nombre}`);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedPetId = params.get("mascotaId") || "";
    setMascotaId(requestedPetId);
    setAutoOpenRecord(params.get("nuevo") === "1");
    load(requestedPetId);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    if (!mascotaId) {
      setPetError("Selecciona una mascota de los resultados");
      setPetListOpen(true);
      return;
    }
    const fd = new FormData(e.currentTarget);
    const pronostico = PRONOSTICOS.map((p) => p.value).filter(
      (value) => fd.get(`pronostico_${value}`) === "on"
    );
    const examenesComplementarios = fd
      .getAll("examenes_complementarios")
      .map(String)
      .map((examen) =>
        examen === "Otros"
          ? `Otros: ${String(fd.get("otro_examen_complementario") || "").trim()}`
          : examen
      )
      .join(", ");

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
        examenes_complementarios: examenesComplementarios,
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
  const selectedPet = mascotas.find((pet) => String(pet.id) === mascotaId);
  const petFilter = mascotaQuery.trim().toLowerCase();
  const normalizedDniQuery = petFilter
    .replace(/^dni\b[\s:]*/, "")
    .replace(/\D/g, "");
  const isDniQuery =
    /^\d+$/.test(normalizedDniQuery) &&
    (/^\d/.test(petFilter) || /^dni\b/.test(petFilter));
  const filteredPets = mascotas
    .filter((pet) => {
      if (!petFilter) return true;
      const textMatches = [
        pet.nombre,
        pet.cliente_nombre,
        pet.cliente_dni,
        pet.especie,
        pet.raza,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(petFilter);
      const dni = String(pet.cliente_dni || "").replace(/\D/g, "");
      return textMatches || (isDniQuery && dni.includes(normalizedDniQuery));
    })
    .slice(0, 20);

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
          <ModalForm
            title="Nuevo registro clínico"
            triggerLabel="Nuevo registro"
            openOnMount={autoOpenRecord}
            onOpen={() => setOtherExamSelected(false)}
          >
            {(close) => (
              <form className="clinical-form" onSubmit={(e) => onSubmit(e, close)}>
                <div className="form-grid">
                  <div className="field full">
                    <label htmlFor="mascota-search">Mascota</label>
                    <input type="hidden" name="mascota_id" value={mascotaId} />
                    <div className="owner-picker">
                      <input
                        id="mascota-search"
                        type="search"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={petListOpen}
                        aria-controls="mascota-results"
                        placeholder="Buscar por mascota o dueño..."
                        value={mascotaQuery}
                        required
                        autoComplete="off"
                        onChange={(event) => {
                          setMascotaQuery(event.target.value);
                          setMascotaId("");
                          setPetError("");
                          setPetListOpen(true);
                        }}
                        onFocus={() => setPetListOpen(true)}
                        onBlur={() => {
                          window.setTimeout(() => setPetListOpen(false), 150);
                        }}
                      />
                      {petListOpen ? (
                        <ul
                          id="mascota-results"
                          className="owner-results"
                          role="listbox"
                        >
                          {filteredPets.length === 0 ? (
                            <li className="owner-empty">Sin resultados</li>
                          ) : (
                            filteredPets.map((pet) => (
                              <li key={pet.id}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={String(pet.id) === mascotaId}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setMascotaId(String(pet.id));
                                    setMascotaQuery(
                                      `${pet.nombre} · ${pet.cliente_nombre}`
                                    );
                                    setPetError("");
                                    setPetListOpen(false);
                                  }}
                                >
                                  <strong>{pet.nombre}</strong>
                                  <span>
                                    {[
                                      pet.cliente_nombre,
                                      pet.cliente_dni ? `DNI ${pet.cliente_dni}` : "",
                                      pet.especie,
                                      pet.raza,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </span>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      ) : null}
                    </div>
                    {petError ? (
                      <small style={{ color: "var(--danger)" }}>{petError}</small>
                    ) : null}
                  </div>
                  {selectedPet?.importante?.trim() ? (
                    <div className="clinical-important-card" role="note">
                      <strong>Importante para {selectedPet.nombre}</strong>
                      <p>{selectedPet.importante}</p>
                    </div>
                  ) : null}
                  <div className="field">
                    <label>Fecha</label>
                    <input
                      type="date"
                      name="fecha"
                      required
                      defaultValue={today}
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
                  <div className="check-grid">
                    {[
                      "Hemograma",
                      "Bioquímico",
                      "Ecografía",
                      "Radiografía",
                      "Inmunofluorescencia",
                      "Otros",
                    ].map((examen) => (
                      <label key={examen} className="check-item">
                        <input
                          type="checkbox"
                          name="examenes_complementarios"
                          value={examen}
                          checked={examen === "Otros" ? otherExamSelected : undefined}
                          onChange={
                            examen === "Otros"
                              ? (event) =>
                                  setOtherExamSelected(event.currentTarget.checked)
                              : undefined
                          }
                        />
                        <span>{examen}</span>
                      </label>
                    ))}
                  </div>
                  {otherExamSelected ? (
                    <div className="field full other-exam-field">
                      <label htmlFor="otro_examen_complementario">
                        Especifica el examen
                      </label>
                      <input
                        id="otro_examen_complementario"
                        name="otro_examen_complementario"
                        required
                      />
                    </div>
                  ) : null}
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
