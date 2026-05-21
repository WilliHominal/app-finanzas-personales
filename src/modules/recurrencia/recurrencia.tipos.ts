export type TipoRegla = "Ingreso" | "Gasto";
export type ModoRegla = "Confirmar" | "Automatico";
export type Frecuencia = "Mensual" | "Anual";

export interface ReglaRecurrente {
  id: number;
  tipo: TipoRegla;
  descripcion: string;
  monto: string;
  cuentaId: number;
  categoriaId: number | null;
  frecuencia: Frecuencia;
  diaAplicacion: number;
  mesAplicacion: number | null;
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
  frecuencia: Frecuencia;
  diaAplicacion: number;
  mesAplicacion: number | null;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  modo: ModoRegla;
}

/** Etiqueta legible para cada modo de aplicación. */
export const ETIQUETA_MODO: Record<ModoRegla, string> = {
  Confirmar: "Confirmar",
  Automatico: "Automático",
};

/** Etiqueta legible para cada frecuencia. */
export const ETIQUETA_FRECUENCIA: Record<Frecuencia, string> = {
  Mensual: "Mensual",
  Anual: "Anual",
};

/** Nombres de los meses para las reglas anuales. El índice 0 es enero. */
export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
