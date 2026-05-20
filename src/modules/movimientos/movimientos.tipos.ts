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

/** Tipos que se pueden registrar desde el alta de la Fase 1. */
export const TIPOS_ALTA: Exclude<TipoMovimiento, "Transferencia">[] = [
  "Apertura",
  "Ingreso",
  "Gasto",
];
