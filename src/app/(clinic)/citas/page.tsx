"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ModalForm, SubmitRow, apiJson } from "@/components/ui";
import type { Cita, Mascota } from "@/lib/types";
import { ESTADOS_CITA } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const empty = {
  id: 0,
  mascota_id: 0,
  fecha: format(new Date(), "yyyy-MM-dd"),
  hora: "09:00",
  motivo: "",
  estado: "programada",
  veterinario: "",
  notas: "",
};

export default function CitasPage() {
  const { canDelete } = useAuth();
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [selectedDay, setSelectedDay] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editing, setEditing] = useState(empty);

  const from = format(startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const to = format(endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }), "yyyy-MM-dd");

  async function load() {
    const [c, m] = await Promise.all([
      apiJson<Cita[]>(`/api/citas?from=${from}&to=${to}`),
      apiJson<Mascota[]>("/api/mascotas"),
    ]);
    setCitas(c);
    setMascotas(m);
  }

  useEffect(() => {
    load();
  }, [from, to]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
    });
  }, [cursor]);

  const dayCitas = citas.filter((c) => c.fecha === selectedDay);

  async function onSubmit(e: FormEvent<HTMLFormElement>, close: () => void) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: editing.id || undefined,
      mascota_id: Number(fd.get("mascota_id")),
      fecha: String(fd.get("fecha")),
      hora: String(fd.get("hora")),
      motivo: String(fd.get("motivo")),
      estado: String(fd.get("estado") || "programada"),
      veterinario: String(fd.get("veterinario") || ""),
      notas: String(fd.get("notas") || ""),
    };
    await apiJson("/api/citas", {
      method: editing.id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    close();
    setEditing(empty);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar esta cita?")) return;
    await apiJson(`/api/citas?id=${id}`, { method: "DELETE" });
    await load();
  }

  function FormFields() {
    return (
      <div className="form-grid">
        <div className="field full">
          <label>Mascota</label>
          <select name="mascota_id" required defaultValue={editing.mascota_id || ""}>
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
          <input type="date" name="fecha" required defaultValue={editing.fecha} />
        </div>
        <div className="field">
          <label>Hora</label>
          <input type="time" name="hora" required defaultValue={editing.hora} />
        </div>
        <div className="field full">
          <label>Motivo</label>
          <input name="motivo" required defaultValue={editing.motivo} />
        </div>
        <div className="field">
          <label>Estado</label>
          <select name="estado" defaultValue={editing.estado}>
            {ESTADOS_CITA.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Veterinario</label>
          <input name="veterinario" defaultValue={editing.veterinario} />
        </div>
        <div className="field full">
          <label>Notas</label>
          <textarea name="notas" defaultValue={editing.notas} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Calendario de citas</h2>
          <p>Agenda mensual y detalle del día seleccionado</p>
        </div>
        <ModalForm
          title="Nueva cita"
          triggerLabel="Nueva cita"
          onOpen={() =>
            setEditing({
              ...empty,
              fecha: selectedDay,
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
      </div>

      <div className="toolbar">
        <button
          type="button"
          className="btn secondary"
          onClick={() => setCursor(addDays(startOfMonth(cursor), -1))}
        >
          ← Mes anterior
        </button>
        <strong style={{ minWidth: 180, textAlign: "center" }}>
          {format(cursor, "MMMM yyyy", { locale: es })}
        </strong>
        <button
          type="button"
          className="btn secondary"
          onClick={() => setCursor(addDays(endOfMonth(cursor), 1))}
        >
          Mes siguiente →
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            const now = new Date();
            setCursor(startOfMonth(now));
            setSelectedDay(format(now, "yyyy-MM-dd"));
          }}
        >
          Hoy
        </button>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-body">
            <div className="calendar">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div className="cal-head" key={d}>
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const items = citas.filter((c) => c.fecha === key).slice(0, 3);
                const extra = citas.filter((c) => c.fecha === key).length - items.length;
                return (
                  <button
                    type="button"
                    key={key}
                    className={[
                      "cal-day",
                      !isSameMonth(day, cursor) ? "muted" : "",
                      isSameDay(day, new Date()) ? "today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedDay(key)}
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      outline:
                        selectedDay === key ? "2px solid var(--brand)" : undefined,
                    }}
                  >
                    <strong>{format(day, "d")}</strong>
                    {items.map((c) => (
                      <span className="cal-chip" key={c.id}>
                        {c.hora} {c.mascota_nombre}
                      </span>
                    ))}
                    {extra > 0 ? (
                      <span className="cal-chip">+{extra} más</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Citas del {selectedDay}</h3>
          </div>
          <div className="panel-body stack">
            {dayCitas.length === 0 ? (
              <div className="empty">Sin citas este día.</div>
            ) : (
              dayCitas.map((c) => (
                <div className="list-item" key={c.id}>
                  <div className="actions" style={{ justifyContent: "space-between" }}>
                    <h4>
                      {c.hora} · {c.mascota_nombre}
                    </h4>
                    <span className={`badge ${c.estado}`}>{c.estado}</span>
                  </div>
                  <p>
                    {c.cliente_nombre}
                    {c.cliente_telefono ? ` · ${c.cliente_telefono}` : ""}
                  </p>
                  <p style={{ marginTop: 4 }}>{c.motivo}</p>
                  <div className="actions" style={{ marginTop: 8 }}>
                    <ModalForm
                      title="Editar cita"
                      triggerLabel="Editar"
                      onOpen={() =>
                        setEditing({
                          id: c.id,
                          mascota_id: c.mascota_id,
                          fecha: c.fecha,
                          hora: c.hora,
                          motivo: c.motivo,
                          estado: c.estado,
                          veterinario: c.veterinario || "",
                          notas: c.notas || "",
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
                        onClick={() => remove(c.id)}
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
      </div>
    </>
  );
}
