export type TipoCuenta =
  | "Efectivo"
  | "BancoCorriente"
  | "Remunerada"
  | "CriptoLiquido"
  | "CriptoInversion"
  | "InversionesLargoPlazo"
  | "PrestamoOtorgado"
  | "PrestamoRecibido";

export type EstadoCuenta = "Activa" | "Archivada";

export interface Cuenta {
  id: number;
  nombre: string;
  tipo: TipoCuenta;
  monedaId: number;
  estado: EstadoCuenta;
  enUso: boolean;
}

export interface NuevaCuenta {
  nombre: string;
  tipo: TipoCuenta;
  monedaId: number;
}

/** Etiqueta legible para cada tipo de cuenta. */
export const ETIQUETA_TIPO: Record<TipoCuenta, string> = {
  Efectivo: "Efectivo",
  BancoCorriente: "Banco Corriente",
  Remunerada: "Cuenta Remunerada",
  CriptoLiquido: "Cripto Líquido",
  CriptoInversion: "Cripto Inversión",
  InversionesLargoPlazo: "Inversiones Largo Plazo",
  PrestamoOtorgado: "Préstamo Otorgado",
  PrestamoRecibido: "Préstamo Recibido",
};

/** Tipos de cuenta ofrecidos en el alta, en orden de uso esperado. */
export const TIPOS_CUENTA: TipoCuenta[] = [
  "Efectivo",
  "BancoCorriente",
  "Remunerada",
  "CriptoLiquido",
  "CriptoInversion",
  "InversionesLargoPlazo",
  "PrestamoOtorgado",
  "PrestamoRecibido",
];

/** Bloques de liquidez con los que el dashboard agrupa las cuentas. */
export type BloqueLiquidez =
  | "Disponibilidad Fija"
  | "Disponibilidad Remunerada"
  | "Cripto Líquido"
  | "Inversiones de Crecimiento"
  | "Por Cobrar / Por Pagar";

export const BLOQUE_DE_TIPO: Record<TipoCuenta, BloqueLiquidez> = {
  Efectivo: "Disponibilidad Fija",
  BancoCorriente: "Disponibilidad Fija",
  Remunerada: "Disponibilidad Remunerada",
  CriptoLiquido: "Cripto Líquido",
  CriptoInversion: "Inversiones de Crecimiento",
  InversionesLargoPlazo: "Inversiones de Crecimiento",
  PrestamoOtorgado: "Por Cobrar / Por Pagar",
  PrestamoRecibido: "Por Cobrar / Por Pagar",
};

/** Orden en que se muestran los bloques en el dashboard. */
export const ORDEN_BLOQUES: BloqueLiquidez[] = [
  "Disponibilidad Fija",
  "Disponibilidad Remunerada",
  "Cripto Líquido",
  "Inversiones de Crecimiento",
  "Por Cobrar / Por Pagar",
];
