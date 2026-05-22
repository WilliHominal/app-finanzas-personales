import { crearMovimiento } from "../movimientos/movimientos.repositorio";
import { crearCuenta } from "./cuentas.repositorio";
import type { NuevaCuenta } from "./cuentas.tipos";

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Da de alta una cuenta y, si se indicó un saldo inicial mayor a cero,
 * lo registra como un movimiento de Apertura sobre la cuenta nueva — sin
 * contrapartida, igual que la apertura de una tenencia. Devuelve el id de
 * la cuenta creada.
 */
export async function crearCuentaConSaldoInicial(
  datos: NuevaCuenta,
  saldoInicial: string,
): Promise<number> {
  const cuentaId = await crearCuenta(datos);

  const monto = Number(saldoInicial);
  if (saldoInicial.trim() !== "" && Number.isFinite(monto) && monto > 0) {
    await crearMovimiento({
      fecha: hoy(),
      descripcion: "Saldo inicial",
      tipo: "Apertura",
      cuentaOrigenId: null,
      cuentaDestinoId: cuentaId,
      montoOrigen: null,
      montoDestino: monto.toFixed(2),
      categoriaId: null,
      reglaRecurrenteId: null,
    });
  }

  return cuentaId;
}
