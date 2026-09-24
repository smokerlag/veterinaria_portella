"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fd.get("username"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }
      const next = params.get("next") || "/";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Veterinaria Portella</h1>
        <p className="login-sub">Inicia sesión en tu cuenta</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              defaultValue="admin"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="login-error">{error}</p> : null}
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="login-hint">
          <strong>admin</strong> / admin123 · <strong>veterinario</strong> /
          vet123 · <strong>asistente</strong> / asis123
        </p>
      </div>
    </div>
  );
}
