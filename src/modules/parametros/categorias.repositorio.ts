import { obtenerDb } from "../../shared/db";
import type { Categoria, NuevaCategoria, TipoCategoria } from "./categorias.tipos";

interface FilaCategoria {
  id: number;
  nombre: string;
  tipo: string;
  color: string | null;
  activa: number;
  usos: number;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaCategoria[]>(
    `SELECT c.id, c.nombre, c.tipo, c.color, c.activa,
            (SELECT COUNT(*) FROM movimiento m WHERE m.categoria_id = c.id) AS usos
     FROM categoria c
     ORDER BY c.tipo, c.nombre`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo as TipoCategoria,
    color: fila.color,
    activa: fila.activa === 1,
    enUso: fila.usos > 0,
  }));
}

export async function crearCategoria(nueva: NuevaCategoria): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    "INSERT INTO categoria (nombre, tipo, color) VALUES ($1, $2, $3)",
    [nueva.nombre, nueva.tipo, nueva.color],
  );
}

export async function cambiarEstadoCategoria(
  id: number,
  activa: boolean,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute("UPDATE categoria SET activa = $1 WHERE id = $2", [
    activa ? 1 : 0,
    id,
  ]);
}

/** Elimina una categoría. Solo es seguro si no tiene movimientos asociados. */
export async function eliminarCategoria(id: number): Promise<void> {
  const db = await obtenerDb();
  await db.execute("DELETE FROM categoria WHERE id = $1", [id]);
}
