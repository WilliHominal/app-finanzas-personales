# Finanzas

Aplicación de escritorio para la **gestión de finanzas personales**: multidivisa, local-first y offline. Centraliza cuentas en varias monedas, registra movimientos, automatiza ingresos y gastos recurrentes y muestra el patrimonio consolidado en tiempo real.

Toda la información vive en un único archivo SQLite local — sin nube, sin cuentas, sin servidores.

## Características

- **Cuentas multidivisa** — ARS, USD, USDT y USDC, agrupadas por bloque de liquidez.
- **Movimientos** — ingresos, gastos, transferencias y *canjes* (cambio entre monedas, con monto de origen y de destino propios).
- **Reglas recurrentes** — suscripciones, sueldos y pagos anuales que se registran solos (modo Automático) o quedan como pendientes de confirmar.
- **Rendimientos** — cuentas remuneradas con TNA por tramos; el interés compuesto se acredita solo, día a día.
- **Préstamos** — otorgados y recibidos, con sus cobros, pagos y ampliaciones, y el historial de cada uno.
- **Dashboard** — totales por moneda y patrimonio consolidado, con el saldo de cada cuenta.
- **Proyecciones** — simula el patrimonio a 3, 6, 12 o 24 meses, en pesos nominales y de hoy.
- **Cotizaciones automáticas** — dólar MEP (dolarapi.com) y cripto Fiwind (criptoya.com), con cache offline.
- **Decimal exacto** — el dinero nunca se representa con punto flotante.

## Stack

- **Tauri 2** — shell de escritorio nativo y liviano.
- **React + TypeScript + Vite** — interfaz de usuario.
- **Rust** — núcleo financiero: motores de cálculo con `rust_decimal`.
- **SQLite** — persistencia local mediante `tauri-plugin-sql`.

## Arquitectura

Arquitectura hexagonal. El dominio financiero vive en un crate de Rust (`nucleo`) que **no depende de Tauri, SQLite ni React**: contiene únicamente reglas de negocio y cálculos, cubiertos por tests. La interfaz es un adaptador de presentación; SQLite, un adaptador de persistencia.

```
finanzas/
├─ src/         Interfaz React, organizada en módulos por dominio
├─ src-tauri/   Aplicación Tauri + migraciones SQLite versionadas
├─ nucleo/      Núcleo financiero — dominio puro en Rust
└─ docs/        Análisis de requerimientos y planificación
```

## Desarrollo

### Requisitos

- Node.js 20 o superior
- Rust (toolchain estable)
- Requisitos de Tauri según el sistema operativo — ver [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)

### Comandos

| Comando | Descripción |
| --- | --- |
| `npm install` | Instala las dependencias. |
| `npm run tauri dev` | Levanta la aplicación en modo desarrollo. |
| `npm run tauri build` | Compila el ejecutable de escritorio. |
| `npm test` | Ejecuta los tests del frontend (Vitest). |
| `cargo test` | Ejecuta los tests del núcleo (Rust). |

## Estado del proyecto

Desarrollo incremental por fases — cada una deja la aplicación en un estado usable:

- ✅ **Fase 0** — Cimientos
- ✅ **Fase 1** — MVP: libro de cuentas
- ✅ **Fase 2** — Multidivisa y canjes
- ✅ **Fase 3** — Reglas recurrentes
- ✅ **Fase 4** — Rendimientos y préstamos
- ✅ **Fase 5** — Simulador de proyecciones
- ⬜ **Fase 6** — Pulido y producto
- ⬜ **Fase 7** — Automatización y multiplataforma

---

Proyecto de uso personal.
