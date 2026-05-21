import { crearMovimiento, listarMovimientos } from "../movimientos/movimientos.repositorio";
import type { Movimiento, NuevoMovimiento } from "../movimientos/movimientos.tipos";
import { ocurrenciasHasta } from "./motor";
import { listarReglas } from "./recurrencia.repositorio";
import type { ReglaRecurrente } from "./recurrencia.tipos";

export interface Pendiente {
  regla: ReglaRecurrente;
  fecha: string;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Construye el movimiento real que corresponde a una ocurrencia de la regla. */
function movimientoDesdeRegla(
  regla: ReglaRecurrente,
  fecha: string,
): NuevoMovimiento {
  const esGasto = regla.tipo === "Gasto";
  return {
    fecha,
    descripcion: regla.descripcion,
    tipo: regla.tipo,
    cuentaOrigenId: esGasto ? regla.cuentaId : null,
    cuentaDestinoId: esGasto ? null : regla.cuentaId,
    montoOrigen: esGasto ? regla.monto : null,
    montoDestino: esGasto ? null : regla.monto,
    categoriaId: regla.categoriaId,
    reglaRecurrenteId: regla.id,
  };
}

/** Agrupa las fechas ya generadas por cada regla. */
function fechasGeneradas(movimientos: Movimiento[]): Map<number, Set<string>> {
  const mapa = new Map<number, Set<string>>();
  for (const movimiento of movimientos) {
    if (movimiento.reglaRecurrenteId === null) continue;
    const fechas = mapa.get(movimiento.reglaRecurrenteId) ?? new Set<string>();
    fechas.add(movimiento.fecha);
    mapa.set(movimiento.reglaRecurrenteId, fechas);
  }
  return mapa;
}

/**
 * Genera los movimientos de las reglas en modo Automático cuya fecha ya pasó.
 * Es idempotente: nunca duplica una ocurrencia ya registrada.
 */
export async function aplicarReglasAutomaticas(): Promise<number> {
  const [reglas, movimientos] = await Promise.all([
    listarReglas(),
    listarMovimientos(),
  ]);
  const generadas = fechasGeneradas(movimientos);
  const fechaHoy = hoy();
  let generados = 0;

  for (const regla of reglas) {
    if (!regla.activa || regla.modo !== "Automatico") continue;
    const ocurrencias = ocurrenciasHasta(
      regla.vigenciaDesde,
      regla.vigenciaHasta,
      regla.diaAplicacion,
      fechaHoy,
    );
    const yaGeneradas = generadas.get(regla.id) ?? new Set<string>();
    for (const fecha of ocurrencias) {
      if (yaGeneradas.has(fecha)) continue;
      await crearMovimiento(movimientoDesdeRegla(regla, fecha));
      generados += 1;
    }
  }

  return generados;
}

/** Calcula las ocurrencias de reglas en modo Confirmar que faltan registrar. */
export async function calcularPendientes(): Promise<Pendiente[]> {
  const [reglas, movimientos] = await Promise.all([
    listarReglas(),
    listarMovimientos(),
  ]);
  const generadas = fechasGeneradas(movimientos);
  const fechaHoy = hoy();
  const pendientes: Pendiente[] = [];

  for (const regla of reglas) {
    if (!regla.activa || regla.modo !== "Confirmar") continue;
    const ocurrencias = ocurrenciasHasta(
      regla.vigenciaDesde,
      regla.vigenciaHasta,
      regla.diaAplicacion,
      fechaHoy,
    );
    const yaGeneradas = generadas.get(regla.id) ?? new Set<string>();
    for (const fecha of ocurrencias) {
      if (!yaGeneradas.has(fecha)) pendientes.push({ regla, fecha });
    }
  }

  pendientes.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return pendientes;
}

/** Confirma un pendiente: lo convierte en un movimiento real. */
export async function confirmarPendiente(pendiente: Pendiente): Promise<void> {
  await crearMovimiento(movimientoDesdeRegla(pendiente.regla, pendiente.fecha));
}
