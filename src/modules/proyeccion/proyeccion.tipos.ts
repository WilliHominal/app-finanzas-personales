export type Horizonte = 3 | 6 | 12 | 24;

export const HORIZONTES: Horizonte[] = [3, 6, 12, 24];

export interface SupuestosProyeccion {
  inflacionAnual: string;
  rendimientoInversionesAnual: string;
}

export interface PuntoProyeccion {
  mes: number;
  patrimonioNominal: string;
  patrimonioUsd: string;
}
