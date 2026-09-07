# Veterinaria Portella

Sistema local de gestión veterinaria para PC servidor. Corre en el navegador de la misma red (LAN).

## Requisitos

- Windows (o cualquier OS con Node.js)
- Node.js 20+ (LTS)
- PC recomendada: Core i5 / 8 GB RAM / disco local (SQLite)

## Instalación (una vez)

```bash
cd veterinaria_portella
npm install
npm run db:seed
```

`db:seed` carga clientes/mascotas/citas de ejemplo. Puedes omitirlo si quieres empezar vacío.

## Uso diario en el servidor

```bash
npm run build
npm start
```

Abre en el propio servidor:

- http://localhost:3000

Desde otras PCs/celulares de la misma red WiFi/LAN:

1. En el servidor, averigua la IP local (`ipconfig` → IPv4, ej. `192.168.1.20`)
2. Abre en el navegador: `http://192.168.1.20:3000`
3. Si no abre, permite el puerto **3000** en el Firewall de Windows

> Requiere **Node.js 22+** (usa SQLite integrado de Node, sin instalar MySQL).

## Módulos

- **Login**: acceso con usuario/contraseña
- **Inicio**: resumen del día, citas y pendientes
- **Clientes**: dueños y contacto
- **Mascotas**: pacientes vinculados a clientes
- **Calendario**: citas mensuales y por día
- **Historial clínico**: consultas, vacunas, tratamientos
- **Pendientes**: tareas y recordatorios

### Acceso inicial

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | `admin` | `admin123` |
| Veterinario | `veterinario` | `vet123` |
| Asistente | `asistente` | `asis123` |

El administrador puede crear más usuarios en **Usuarios**.

### Permisos por rol

| Acción | Admin | Veterinario | Asistente |
| --- | --- | --- | --- |
| Clientes / mascotas / citas / pendientes | Todo | Todo | Crear y editar (sin eliminar) |
| Historial clínico | Todo | Todo | Solo lectura |
| Usuarios | Sí | No | No |

## Datos

La base SQLite se guarda en:

```text
data/veterinaria.db
```

Haz copia de esa carpeta `data/` para respaldar.

## Notas para el hardware

- No necesita MySQL/PostgreSQL ni Docker
- Un solo proceso Node + archivo SQLite
- Ideal para uso interno de clínica (no expuesto a Internet)
