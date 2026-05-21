export type TipoRegla = "Ingreso" | "Gasto";
export type ModoRegla = "Confirmar" | "Automatico";

export interface ReglaRecurrente {
  id: number;
  tipo: TipoRegla;
  descripcion: string;
  monto: string;
  cuentaId: number;
  categoriaId: number | null;
  diaAplicacion: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  modo: ModoRegla;
  activa: boolean;
}

export interface NuevaRegla {
  tipo: TipoRegla;
  descripcion: string;
  monto: string;
  cuentaId: number;
  categoriaId: number;
  diaAplicacion: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  modo: ModoRegla;
}

/** Etiqueta legible para cada modo de aplicación. */
export const ETIQUETA_MODO: Record<ModoRegla, string> = {
  Confirmar: "Confirmar",
  Automatico: "Automático",
};
