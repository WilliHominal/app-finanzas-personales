import { obtenerDb } from "../../shared/db";
import type { NuevoTramo, TramoTna } from "./rendimientos.tipos";

interface FilaTramo {
  id: number;
  cuenta_id: number;
  vigencia_desde: string;
  tna: string;
}

interface FilaPuntero {
  id: number;
  interes_acreditado_hasta: string | null;
}

export async function listarTramos(): Promise<TramoTna[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaTramo[]>(
    `SELECT id, cuenta_id, vigencia_desde, tna
     FROM tasa_tna
     ORDER BY cuenta_id, vigencia_desde DESC`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    cuentaId: fila.cuenta_id,
    vigenciaDesde: fila.vigencia_desde,
    tna: fila.tna,
  }));
}

/**
 * Inserta un tramo de TNA. Si la cuenta todavía no tenía tramos, fija el
 * puntero de acreditación en la fecha de vigencia: el interés se devenga
 * desde el día siguiente.
 */
export async function crearTramo(nuevo: NuevoTramo): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    "INSERT INTO tasa_tna (cuenta_id, vigencia_desde, tna) VALUES ($1, $2, $3)",
    [nuevo.cuentaId, nuevo.vigenciaDesde, nuevo.tna],
  );
  await db.execute(
    `UPDATE cuenta SET interes_acreditado_hasta = $1
     WHERE id = $2 AND interes_acreditado_hasta IS NULL`,
    [nuevo.vigenciaDesde, nuevo.cuentaId],
  );
}

export async function eliminarTramo(id: number): Promise<void> {
  const db = await obtenerDb();
  await db.execute("DELETE FROM tasa_tna WHERE id = $1", [id]);
}

export async function obtenerPunteros(): Promise<Map<number, string | null>> {
  const db = await obtenerDb();
  const filas = await db.select<FilaPuntero[]>(
    "SELECT id, interes_acreditado_hasta FROM cuenta",
  );
  return new Map(filas.map((fila) => [fila.id, fila.interes_acreditado_hasta]));
}

export async function avanzarPuntero(
  cuentaId: number,
  fecha: string,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    "UPDATE cuenta SET interes_acreditado_hasta = $1 WHERE id = $2",
    [fecha, cuentaId],
  );
}

/** Devuelve la categoría de interés, creándola la primera vez. */
export async function obtenerCategoriaInteres(): Promise<number> {
  const db = await obtenerDb();
  const existentes = await db.select<{ id: number }[]>(
    "SELECT id FROM categoria WHERE nombre = $1 AND tipo = 'Ingreso' LIMIT 1",
    ["Interés"],
  );
  if (existentes.length > 0) return existentes[0].id;
  const resultado = await db.execute(
    "INSERT INTO categoria (nombre, tipo, color) VALUES ('Interés', 'Ingreso', $1)",
    ["#0d7a5f"],
  );
  return resultado.lastInsertId as number;
}
