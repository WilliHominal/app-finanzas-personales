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
}

/** Tipos de movimiento que se pueden registrar. */
export const TIPOS_MOVIMIENTO: TipoMovimiento[] = [
  "Apertura",
  "Ingreso",
  "Gasto",
  "Transferencia",
];
