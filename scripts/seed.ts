import { randomBytes, scryptSync } from "node:crypto";
import { getDb } from "../src/lib/db";
import {
  createCita,
  createCliente,
  createHistorial,
  createMascota,
  createPendiente,
} from "../src/lib/queries";

const db = getDb();
const count = (
  db.prepare(`SELECT COUNT(*) AS n FROM clientes`).get() as { n: number }
).n;

if (count > 0) {
  console.log("La base ya tiene datos. Seed omitido.");
  process.exit(0);
}

const defaultUsers = [
  { username: "admin", password: "admin123", nombre: "Administrador", rol: "admin" },
  { username: "veterinario", password: "vet123", nombre: "Veterinario", rol: "veterinario" },
  { username: "asistente", password: "asis123", nombre: "Asistente", rol: "asistente" },
] as const;
const insertUser = db.prepare(
  `INSERT INTO usuarios (username, password_hash, nombre, rol) VALUES (?, ?, ?, ?)`
);
for (const user of defaultUsers) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(user.password, salt, 64).toString("hex");
  insertUser.run(user.username, `${salt}:${hash}`, user.nombre, user.rol);
}

const c1 = createCliente({
  nombre: "María López",
  dni: "12345678",
  telefono: "999111222",
  email: "maria@example.com",
  direccion: "Av. Principal 123",
});
const c2 = createCliente({
  nombre: "Carlos Ruiz",
  dni: "87654321",
  telefono: "988777666",
  email: "carlos@example.com",
  direccion: "Jr. Los Olivos 45",
});

const m1 = createMascota({
  cliente_id: c1,
  nombre: "Max",
  especie: "perro",
  raza: "Labrador",
  sexo: "macho",
  peso_kg: 28.5,
});
const m2 = createMascota({
  cliente_id: c1,
  nombre: "Michi",
  especie: "gato",
  raza: "Mestizo",
  sexo: "hembra",
  peso_kg: 4.2,
});
const m3 = createMascota({
  cliente_id: c2,
  nombre: "Rocky",
  especie: "perro",
  raza: "Bulldog",
  sexo: "macho",
  peso_kg: 22,
});

const today = new Date().toISOString().slice(0, 10);

createCita({
  mascota_id: m1,
  fecha: today,
  hora: "10:00",
  motivo: "Control general",
  estado: "confirmada",
  veterinario: "Dra. Portella",
});
createCita({
  mascota_id: m2,
  fecha: today,
  hora: "11:30",
  motivo: "Vacuna anual",
  estado: "programada",
});

createHistorial({
  mascota_id: m1,
  fecha: today,
  tipo: "consulta",
  diagnostico: "Buen estado general",
  tratamiento: "Continuar alimentación actual",
  peso_kg: 28.5,
  veterinario: "Dra. Portella",
});

createPendiente({
  titulo: "Llamar a Carlos por resultado de laboratorio",
  prioridad: "alta",
  fecha_limite: today,
  cliente_id: c2,
  mascota_id: m3,
});
createPendiente({
  titulo: "Reponer stock de antiparasitario",
  prioridad: "media",
});

console.log("Datos de ejemplo cargados.");
