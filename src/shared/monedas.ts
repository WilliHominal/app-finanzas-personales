import { obtenerDb } from "./db";

export interface Moneda {
  id: number;
  codigo: string;
  simbolo: string;
}

/** Moneda en la que se puede ver el patrimonio consolidado. */
export type GrupoMoneda = "Pesos" | "Dolares";

/** Lista las monedas disponibles (semilla: ARS, USD, USDT, USDC). */
export async function listarMonedas(): Promise<Moneda[]> {
  const db = await obtenerDb();
  return db.select<Moneda[]>(
    "SELECT id, codigo, simbolo FROM moneda ORDER BY id",
  );
}
