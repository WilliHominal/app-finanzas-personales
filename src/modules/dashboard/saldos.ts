import { invoke } from "@tauri-apps/api/core";
import type { Movimiento } from "../movimientos/movimientos.tipos";

export interface SaldoCuenta {
  cuentaId: number;
  saldo: string;
}

/**
 * Pide al núcleo financiero (Rust) el saldo de cada cuenta, calculado a
 * partir de la lista de movimientos.
 */
export function calcularSaldos(
  cuentas: number[],
  movimientos: Movimiento[],
): Promise<SaldoCuenta[]> {
  return invoke<SaldoCuenta[]>("calcular_saldos", { cuentas, movimientos });
}
