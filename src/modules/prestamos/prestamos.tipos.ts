export type TipoPrestamo = "Otorgado" | "Recibido";

export interface Prestamo {
  id: number;
  cuentaId: number;
  contraparte: string;
  capital: string;
  fecha: string;
  notas: string | null;
  tipo: TipoPrestamo;
}

export interface NuevoPrestamo {
  tipo: TipoPrestamo;
  contraparte: string;
  capital: string;
  fecha: string;
  notas: string | null;
  monedaId: number;
  preexistente: boolean;
  cuentaPropiaId: number | null;
}

/** Etiqueta legible para cada tipo de préstamo. */
export const ETIQUETA_TIPO_PRESTAMO: Record<TipoPrestamo, string> = {
  Otorgado: "Otorgado",
  Recibido: "Recibido",
};
