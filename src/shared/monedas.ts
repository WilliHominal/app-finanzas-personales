import { obtenerDb } from "./db";

/** Una unidad de cuenta: una moneda corriente o un instrumento bursátil. */
export type TipoUnidad = "Moneda" | "Instrumento";

export interface Moneda {
  id: number;
  codigo: string;
  simbolo: string;
  tipo: TipoUnidad;
  /** Precio en pesos por unidad. Solo lo usan los instrumentos. */
  precio: string | null;
  precioActualizado: string | null;
}

/** Moneda en la que se puede ver el patrimonio consolidado. */
export type GrupoMoneda = "Pesos" | "Dolares";

interface FilaMoneda {
  id: number;
  codigo: string;
  simbolo: string;
  tipo: string;
  precio: string | null;
  precio_actualizado: string | null;
}

/** Lista las unidades de cuenta: monedas corrientes e instrumentos. */
export async function listarMonedas(): Promise<Moneda[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaMoneda[]>(
    "SELECT id, codigo, simbolo, tipo, precio, precio_actualizado FROM moneda ORDER BY id",
  );
  return filas.map((fila) => ({
    id: fila.id,
    codigo: fila.codigo,
    simbolo: fila.simbolo,
    tipo: fila.tipo as TipoUnidad,
    precio: fila.precio,
    precioActualizado: fila.precio_actualizado,
  }));
}
