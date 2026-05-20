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
