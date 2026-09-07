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

const c1 = createCliente({
  nombre: "María López",
  telefono: "999111222",
  email: "maria@example.com",
  direccion: "Av. Principal 123",
});
const c2 = createCliente({
  nombre: "Carlos Ruiz",
  telefono: "988777666",
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
