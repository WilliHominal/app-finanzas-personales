import { invoke } from "@tauri-apps/api/core";
import { listarMonedas } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { obtenerResumen } from "../dashboard/resumen";
import {
  crearMovimiento,
  listarMovimientos,
} from "../movimientos/movimientos.repositorio";
import {
  avanzarPuntero,
  listarTramos,
  obtenerCategoriaInteres,
  obtenerPunteros,
} from "./rendimientos.repositorio";

const DECIMALES_MONEDA = 2;

interface TramoEntrada {
  vigenciaDesde: string;
  tna: string;
}

interface CuentaRemuneradaEntrada {
  cuentaId: number;
  saldo: string;
  decimales: number;
  interesAcreditadoHasta: string | null;
  tramos: TramoEntrada[];
}

interface AcreditacionSalida {
  fecha: string;
  monto: string;
}

interface RendimientoCuenta {
  cuentaId: number;
  acreditaciones: AcreditacionSalida[];
  gananciaDiaria: string;
  saldoProyectadoFinMes: string;
  interesProyectadoFinMes: string;
}

export interface RendimientoVista {
  cuentaId: number;
  nombre: string;
  saldo: string;
  tnaVigente: string | null;
  gananciaDiaria: string;
  interesProyectadoFinMes: string;
  saldoProyectadoFinMes: string;
}

interface CuentasReunidas {
  entradas: CuentaRemuneradaEntrada[];
  remuneradas: Cuenta[];
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/** TNA del tramo más reciente cuya vigencia ya empezó. */
function tnaVigente(tramos: TramoEntrada[], hoy: string): string | null {
  const vigentes = tramos.filter((tramo) => tramo.vigenciaDesde <= hoy);
  if (vigentes.length === 0) return null;
  return vigentes.reduce((a, b) =>
    a.vigenciaDesde >= b.vigenciaDesde ? a : b,
  ).tna;
}

/**
 * Reúne, para cada cuenta remunerada activa, el saldo calculado por el
 * núcleo, sus tramos de TNA y el puntero de acreditación.
 */
async function reunirCuentasRemuneradas(): Promise<CuentasReunidas> {
  const [cuentas, monedas, movimientos, tramos, punteros] = await Promise.all([
    listarCuentas(),
    listarMonedas(),
    listarMovimientos(),
    listarTramos(),
    obtenerPunteros(),
  ]);

  const remuneradas = cuentas.filter(
    (cuenta) => cuenta.tipo === "Remunerada" && cuenta.estado === "Activa",
  );
  const codigoMoneda = new Map(
    monedas.map((moneda) => [moneda.id, moneda.codigo]),
  );
  const cuentasParaResumen = cuentas.map((cuenta) => ({
    id: cuenta.id,
    moneda: codigoMoneda.get(cuenta.monedaId) ?? "ARS",
  }));
  const resumen = await obtenerResumen(cuentasParaResumen, movimientos, {
    financiero: "0",
    cripto: "0",
  });
  const saldoDe = new Map(
    resumen.saldos.map((saldo) => [saldo.cuentaId, saldo.saldo]),
  );

  const entradas = remuneradas.map((cuenta) => ({
    cuentaId: cuenta.id,
    saldo: saldoDe.get(cuenta.id) ?? "0",
    decimales: DECIMALES_MONEDA,
    interesAcreditadoHasta: punteros.get(cuenta.id) ?? null,
    tramos: tramos
      .filter((tramo) => tramo.cuentaId === cuenta.id)
      .map((tramo) => ({ vigenciaDesde: tramo.vigenciaDesde, tna: tramo.tna })),
  }));

  return { entradas, remuneradas };
}

function calcularRendimientos(
  entradas: CuentaRemuneradaEntrada[],
  hoy: string,
): Promise<RendimientoCuenta[]> {
  return invoke<RendimientoCuenta[]>("calcular_rendimientos", {
    cuentas: entradas,
    hoy,
  });
}

/**
 * Genera los movimientos de interés que faltan acreditar en cada cuenta
 * remunerada. Es idempotente: el puntero de acreditación avanza con cada
 * movimiento creado, así una corrida interrumpida se retoma sin duplicar.
 */
export async function acreditarInteresPendiente(): Promise<number> {
  const { entradas } = await reunirCuentasRemuneradas();
  if (entradas.length === 0) return 0;

  const hoy = fechaHoy();
  const rendimientos = await calcularRendimientos(entradas, hoy);
  const conAcreditaciones = rendimientos.filter(
    (rendimiento) => rendimiento.acreditaciones.length > 0,
  );
  if (conAcreditaciones.length === 0) return 0;

  const categoriaId = await obtenerCategoriaInteres();
  let generados = 0;

  for (const rendimiento of conAcreditaciones) {
    for (const acreditacion of rendimiento.acreditaciones) {
      await crearMovimiento({
        fecha: acreditacion.fecha,
        descripcion: "Interés",
        tipo: "Ingreso",
        cuentaOrigenId: null,
        cuentaDestinoId: rendimiento.cuentaId,
        montoOrigen: null,
        montoDestino: acreditacion.monto,
        categoriaId,
        reglaRecurrenteId: null,
      });
      await avanzarPuntero(rendimiento.cuentaId, acreditacion.fecha);
      generados += 1;
    }
  }

  return generados;
}

/** Calcula la proyección de fin de mes de cada cuenta remunerada. */
export async function obtenerRendimientos(): Promise<RendimientoVista[]> {
  const { entradas, remuneradas } = await reunirCuentasRemuneradas();
  if (entradas.length === 0) return [];

  const hoy = fechaHoy();
  const rendimientos = await calcularRendimientos(entradas, hoy);
  const rendimientoDe = new Map(
    rendimientos.map((rendimiento) => [rendimiento.cuentaId, rendimiento]),
  );

  return entradas.map((entrada) => {
    const cuenta = remuneradas.find((c) => c.id === entrada.cuentaId);
    const rendimiento = rendimientoDe.get(entrada.cuentaId);
    return {
      cuentaId: entrada.cuentaId,
      nombre: cuenta?.nombre ?? "—",
      saldo: entrada.saldo,
      tnaVigente: tnaVigente(entrada.tramos, hoy),
      gananciaDiaria: rendimiento?.gananciaDiaria ?? "0",
      interesProyectadoFinMes: rendimiento?.interesProyectadoFinMes ?? "0",
      saldoProyectadoFinMes: rendimiento?.saldoProyectadoFinMes ?? entrada.saldo,
    };
  });
}
