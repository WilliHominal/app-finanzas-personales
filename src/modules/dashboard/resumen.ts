import { invoke } from "@tauri-apps/api/core";
import type { Movimiento } from "../movimientos/movimientos.tipos";

export interface SaldoCuenta {
  cuentaId: number;
  saldo: string;
}

export interface ResumenPatrimonial {
  saldos: SaldoCuenta[];
  totalPesos: string;
  totalDolares: string;
  consolidadoPesos: string;
  consolidadoDolares: string;
}

export interface CuentaParaResumen {
  id: number;
  moneda: string;
  /** Precio en pesos por unidad; solo en cuentas de instrumentos. */
  precioInstrumento?: string;
}

export interface CotizacionesEntrada {
  financiero: string;
  cripto: string;
}

/**
 * Pide al núcleo financiero (Rust) el saldo de cada cuenta, los totales por
 * moneda y el patrimonio consolidado, calculados con decimal exacto.
 */
export function obtenerResumen(
  cuentas: CuentaParaResumen[],
  movimientos: Movimiento[],
  cotizaciones: CotizacionesEntrada,
): Promise<ResumenPatrimonial> {
  return invoke<ResumenPatrimonial>("resumen_patrimonial", {
    cuentas,
    movimientos,
    cotizaciones,
  });
}
