import { invoke } from "@tauri-apps/api/core";
import { listarMonedas } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import { obtenerResumen } from "../dashboard/resumen";
import { listarMovimientos } from "../movimientos/movimientos.repositorio";
import { listarCotizaciones } from "../parametros/cotizaciones.repositorio";
import { listarReglas } from "../recurrencia/recurrencia.repositorio";
import { obtenerRendimientos } from "../rendimientos/rendimientos.servicio";
import type { PuntoProyeccion, SupuestosProyeccion } from "./proyeccion.tipos";

interface EstadoEntrada {
  pesos: string;
  dolares: string;
  inversiones: string;
}

interface RemuneradaEntrada {
  saldo: string;
  tna: string;
}

interface FlujoEntrada {
  monto: string;
  esIngreso: boolean;
  enDolares: boolean;
  frecuencia: string;
  mesAplicacion: number | null;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

interface SupuestosEntrada {
  inflacionAnual: string;
  rendimientoInversionesAnual: string;
  dolarInicial: string;
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reúne la foto patrimonial de hoy, las reglas recurrentes y los supuestos,
 * y delega la proyección mes a mes en el núcleo. Las cuentas se reparten en
 * los baluartes que el motor proyecta distinto: pesos planos, dólares,
 * inversiones y cuentas remuneradas. Los préstamos van congelados en pesos.
 */
export async function obtenerProyeccion(
  horizonteMeses: number,
  supuestos: SupuestosProyeccion,
): Promise<PuntoProyeccion[]> {
  const [cuentas, monedas, movimientos, reglas, cotizaciones, rendimientos] =
    await Promise.all([
      listarCuentas(),
      listarMonedas(),
      listarMovimientos(),
      listarReglas(),
      listarCotizaciones(),
      obtenerRendimientos(),
    ]);

  const codigoMoneda = new Map(monedas.map((m) => [m.id, m.codigo]));
  const monedaPorId = new Map(monedas.map((m) => [m.id, m]));
  const activas = cuentas.filter((c) => c.estado === "Activa");
  const resumen = await obtenerResumen(
    activas.map((c) => ({
      id: c.id,
      moneda: codigoMoneda.get(c.monedaId) ?? "ARS",
    })),
    movimientos,
    { financiero: "0", cripto: "0" },
  );
  const saldoDe = new Map(resumen.saldos.map((s) => [s.cuentaId, s.saldo]));

  const cotizacion = (nombre: string): number =>
    Number(cotizaciones.find((c) => c.nombre === nombre)?.valor ?? "0");
  const mep = cotizacion("Dólar Financiero");
  const cripto = cotizacion("Dólar Cripto");

  const idsRemuneradas = new Set(rendimientos.map((r) => r.cuentaId));

  let pesos = 0;
  let dolaresEnPesos = 0;
  let inversiones = 0;

  for (const cuenta of activas) {
    if (idsRemuneradas.has(cuenta.id)) continue;
    const saldo = Number(saldoDe.get(cuenta.id) ?? "0");
    const moneda = monedaPorId.get(cuenta.monedaId);
    const codigo = moneda?.codigo ?? "ARS";
    const esInstrumento = moneda?.tipo === "Instrumento";
    const valorEnPesos = esInstrumento
      ? saldo * Number(moneda?.precio ?? "0")
      : codigo === "ARS"
        ? saldo
        : saldo * (codigo === "USD" ? mep : cripto);

    if (
      esInstrumento ||
      cuenta.tipo === "CriptoInversion" ||
      cuenta.tipo === "InversionesLargoPlazo"
    ) {
      inversiones += valorEnPesos;
    } else if (codigo === "ARS") {
      pesos += saldo;
    } else {
      dolaresEnPesos += valorEnPesos;
    }
  }

  const estado: EstadoEntrada = {
    pesos: pesos.toFixed(2),
    dolares: (mep > 0 ? dolaresEnPesos / mep : 0).toFixed(2),
    inversiones: inversiones.toFixed(2),
  };

  const remuneradas: RemuneradaEntrada[] = rendimientos.map((r) => ({
    saldo: r.saldo,
    tna: r.tnaVigente ?? "0",
  }));

  const flujos: FlujoEntrada[] = reglas
    .filter((r) => r.activa)
    .map((r) => {
      const cuenta = cuentas.find((c) => c.id === r.cuentaId);
      const codigo = cuenta
        ? (codigoMoneda.get(cuenta.monedaId) ?? "ARS")
        : "ARS";
      return {
        monto: r.monto,
        esIngreso: r.tipo === "Ingreso",
        enDolares: codigo !== "ARS",
        frecuencia: r.frecuencia,
        mesAplicacion: r.mesAplicacion,
        vigenciaDesde: r.vigenciaDesde,
        vigenciaHasta: r.vigenciaHasta,
      };
    });

  const entradaSupuestos: SupuestosEntrada = {
    inflacionAnual: supuestos.inflacionAnual,
    rendimientoInversionesAnual: supuestos.rendimientoInversionesAnual,
    dolarInicial: mep.toString(),
  };

  return invoke<PuntoProyeccion[]>("proyectar", {
    estado,
    remuneradas,
    flujos,
    supuestos: entradaSupuestos,
    horizonte: horizonteMeses,
    hoy: fechaHoy(),
  });
}
