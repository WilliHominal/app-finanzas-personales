import { listarMonedas } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import type { TipoCuenta } from "../cuentas/cuentas.tipos";
import { obtenerResumen } from "../dashboard/resumen";
import {
  crearMovimiento,
  listarMovimientos,
} from "../movimientos/movimientos.repositorio";
import type { Movimiento } from "../movimientos/movimientos.tipos";
import {
  crearCuentaPrestamo,
  insertarPrestamo,
  listarPrestamos,
} from "./prestamos.repositorio";
import type { NuevoPrestamo, Prestamo, TipoPrestamo } from "./prestamos.tipos";

export interface MovimientoPrestamo {
  id: number;
  fecha: string;
  descripcion: string;
  monto: string;
}

export interface PrestamoVista extends Prestamo {
  saldo: string;
  movimientos: MovimientoPrestamo[];
}

const TIPO_CUENTA: Record<TipoPrestamo, TipoCuenta> = {
  Otorgado: "PrestamoOtorgado",
  Recibido: "PrestamoRecibido",
};

/**
 * Registra un préstamo: crea la cuenta que lo representa, su metadata y el
 * movimiento de transferencia que mueve el capital. Un préstamo otorgado
 * saca la plata de una cuenta propia; uno recibido la deposita en ella.
 */
export async function crearPrestamo(datos: NuevoPrestamo): Promise<void> {
  const esOtorgado = datos.tipo === "Otorgado";
  const nombre = `${esOtorgado ? "Préstamo a" : "Préstamo de"} ${datos.contraparte}`;

  const cuentaPrestamoId = await crearCuentaPrestamo(
    nombre,
    TIPO_CUENTA[datos.tipo],
    datos.monedaId,
  );
  await insertarPrestamo(
    cuentaPrestamoId,
    datos.contraparte,
    datos.capital,
    datos.fecha,
    datos.notas,
  );

  if (datos.preexistente) {
    await crearMovimiento({
      fecha: datos.fecha,
      descripcion: nombre,
      tipo: "Apertura",
      cuentaOrigenId: null,
      cuentaDestinoId: cuentaPrestamoId,
      montoOrigen: null,
      montoDestino: esOtorgado ? datos.capital : `-${datos.capital}`,
      categoriaId: null,
      reglaRecurrenteId: null,
    });
    return;
  }

  await crearMovimiento({
    fecha: datos.fecha,
    descripcion: nombre,
    tipo: "Transferencia",
    cuentaOrigenId: esOtorgado ? datos.cuentaPropiaId : cuentaPrestamoId,
    cuentaDestinoId: esOtorgado ? cuentaPrestamoId : datos.cuentaPropiaId,
    montoOrigen: datos.capital,
    montoDestino: datos.capital,
    categoriaId: null,
    reglaRecurrenteId: null,
  });
}

/**
 * Reconstruye el historial de un préstamo: cada movimiento que toca su
 * cuenta, ordenado del más antiguo al más reciente. El monto va firmado
 * según cómo afecta al saldo pendiente — positivo si lo agranda (el
 * préstamo inicial o una ampliación), negativo si lo achica (un cobro o
 * un pago).
 */
function historialDe(
  prestamo: Prestamo,
  movimientos: Movimiento[],
): MovimientoPrestamo[] {
  const esOtorgado = prestamo.tipo === "Otorgado";
  return movimientos
    .filter(
      (mov) =>
        mov.cuentaOrigenId === prestamo.cuentaId ||
        mov.cuentaDestinoId === prestamo.cuentaId,
    )
    .map((mov) => {
      const entra = mov.cuentaDestinoId === prestamo.cuentaId;
      const monto = Number((entra ? mov.montoDestino : mov.montoOrigen) ?? 0);
      const impactoEnSaldo = entra ? monto : -monto;
      const impactoEnPendiente = esOtorgado ? impactoEnSaldo : -impactoEnSaldo;
      return {
        id: mov.id,
        fecha: mov.fecha,
        descripcion: mov.descripcion,
        monto: impactoEnPendiente.toFixed(2),
      };
    })
    .reverse();
}

/** Lista los préstamos con el saldo pendiente y el historial de cada uno. */
export async function obtenerPrestamos(): Promise<PrestamoVista[]> {
  const [prestamos, cuentas, monedas, movimientos] = await Promise.all([
    listarPrestamos(),
    listarCuentas(),
    listarMonedas(),
    listarMovimientos(),
  ]);
  if (prestamos.length === 0) return [];

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

  return prestamos.map((prestamo) => ({
    ...prestamo,
    saldo: saldoDe.get(prestamo.cuentaId) ?? "0",
    movimientos: historialDe(prestamo, movimientos),
  }));
}

export type AccionPrestamo = "pago" | "ampliacion";

/**
 * Registra un cobro, un pago o una ampliación de un préstamo como la
 * transferencia que le corresponde. La dirección la define el tipo de
 * préstamo: un pago achica el saldo pendiente, una ampliación lo agranda.
 */
export async function registrarMovimientoPrestamo(
  prestamo: Prestamo,
  accion: AccionPrestamo,
  monto: string,
  cuentaPropiaId: number,
  fecha: string,
): Promise<void> {
  const prestamoEsOrigen =
    (prestamo.tipo === "Otorgado") === (accion === "pago");

  let descripcion: string;
  if (accion === "ampliacion") {
    descripcion = `Ampliación · ${prestamo.contraparte}`;
  } else if (prestamo.tipo === "Otorgado") {
    descripcion = `Cobro de ${prestamo.contraparte}`;
  } else {
    descripcion = `Pago a ${prestamo.contraparte}`;
  }

  await crearMovimiento({
    fecha,
    descripcion,
    tipo: "Transferencia",
    cuentaOrigenId: prestamoEsOrigen ? prestamo.cuentaId : cuentaPropiaId,
    cuentaDestinoId: prestamoEsOrigen ? cuentaPropiaId : prestamo.cuentaId,
    montoOrigen: monto,
    montoDestino: monto,
    categoriaId: null,
    reglaRecurrenteId: null,
  });
}
