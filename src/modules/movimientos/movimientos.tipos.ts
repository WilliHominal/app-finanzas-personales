export type TipoMovimiento = "Apertura" | "Ingreso" | "Gasto" | "Transferencia";

export interface Movimiento {
  id: number;
  fecha: string;
  descripcion: string;
  tipo: TipoMovimiento;
  cuentaOrigenId: number | null;
  cuentaDestinoId: number | null;
  montoOrigen: string | null;
  montoDestino: string | null;
  categoriaId: number | null;
  reglaRecurrenteId: number | null;
}

export interface NuevoMovimiento {
  fecha: string;
  descripcion: string;
  tipo: TipoMovimiento;
  cuentaOrigenId: number | null;
  cuentaDestinoId: number | null;
  montoOrigen: string | null;
  montoDestino: string | null;
  categoriaId: number | null;
  reglaRecurrenteId: number | null;
}

/**
 * Tipos de movimiento que el usuario puede elegir al registrar un movimiento.
 * "Apertura" queda fuera a propósito: se genera sola desde el saldo inicial de
 * una cuenta (o desde tenencias y préstamos), no se elige a mano.
 */
export const TIPOS_MOVIMIENTO: TipoMovimiento[] = [
  "Ingreso",
  "Gasto",
  "Transferencia",
];
