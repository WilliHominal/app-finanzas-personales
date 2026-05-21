import { obtenerDb } from "../../shared/db";
import { listarMonedas, type Moneda } from "../../shared/monedas";

/** Los instrumentos cargados: las unidades de tipo Instrumento. */
export async function listarInstrumentos(): Promise<Moneda[]> {
  const monedas = await listarMonedas();
  return monedas.filter((moneda) => moneda.tipo === "Instrumento");
}

/** Da de alta un instrumento como una unidad nueva. Devuelve su id. */
export async function crearInstrumento(simbolo: string): Promise<number> {
  const db = await obtenerDb();
  const resultado = await db.execute(
    "INSERT INTO moneda (codigo, simbolo, tipo) VALUES ($1, $2, 'Instrumento')",
    [simbolo, simbolo],
  );
  return resultado.lastInsertId as number;
}

export async function actualizarPrecioInstrumento(
  id: number,
  precio: string,
): Promise<void> {
  const db = await obtenerDb();
  const hoy = new Date().toISOString().slice(0, 10);
  await db.execute(
    "UPDATE moneda SET precio = $1, precio_actualizado = $2 WHERE id = $3",
    [precio, hoy, id],
  );
}
