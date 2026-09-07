import Link from "next/link";
import {
  getDashboardStats,
  listCitas,
  listPendientes,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const stats = getDashboardStats();
  const citasHoy = listCitas({ fecha: stats.today });
  const pendientes = listPendientes(false).slice(0, 6);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Panel del día</h2>
          <p>Resumen de la clínica · {stats.today}</p>
        </div>
        <Link className="btn" href="/citas">
          Ver calendario
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Clientes</span>
          <strong>{stats.clientes}</strong>
        </div>
        <div className="stat">
          <span>Mascotas activas</span>
          <strong>{stats.mascotas}</strong>
        </div>
        <div className="stat">
          <span>Citas hoy</span>
          <strong>{stats.citasHoy}</strong>
        </div>
        <div className="stat">
          <span>Pendientes</span>
          <strong>{stats.pendientes}</strong>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>Agenda de hoy</h3>
            <Link href="/citas">Abrir</Link>
          </div>
          <div className="table-wrap">
            {citasHoy.length === 0 ? (
              <div className="empty">No hay citas programadas para hoy.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Mascota</th>
                    <th>Cliente</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citasHoy.map((c) => (
                    <tr key={c.id}>
                      <td>{c.hora}</td>
                      <td>
                        {c.mascota_nombre}
                        <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                          {c.especie}
                        </div>
                      </td>
                      <td>
                        {c.cliente_nombre}
                        {c.cliente_telefono ? (
                          <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                            {c.cliente_telefono}
                          </div>
                        ) : null}
                      </td>
                      <td>{c.motivo}</td>
                      <td>
                        <span className={`badge ${c.estado}`}>{c.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Pendientes</h3>
            <Link href="/pendientes">Ver todos</Link>
          </div>
          <div className="panel-body stack">
            {pendientes.length === 0 ? (
              <div className="empty">Sin pendientes abiertos.</div>
            ) : (
              pendientes.map((p) => (
                <div className="list-item" key={p.id}>
                  <div className="actions" style={{ justifyContent: "space-between" }}>
                    <h4>{p.titulo}</h4>
                    <span className={`badge ${p.prioridad}`}>{p.prioridad}</span>
                  </div>
                  <p>
                    {p.fecha_limite ? `Límite: ${p.fecha_limite}` : "Sin fecha límite"}
                    {p.cliente_nombre ? ` · ${p.cliente_nombre}` : ""}
                    {p.mascota_nombre ? ` · ${p.mascota_nombre}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
