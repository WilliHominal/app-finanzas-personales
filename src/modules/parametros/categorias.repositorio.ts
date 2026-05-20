import { obtenerDb } from "../../shared/db";
import type { Categoria, NuevaCategoria, TipoCategoria } from "./categorias.tipos";

interface FilaCategoria {
  id: number;
  nombre: string;
  tipo: string;
  color: string | null;
  activa: number;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaCategoria[]>(
    "SELECT id, nombre, tipo, color, activa FROM categoria ORDER BY tipo, nombre",
  );
  return filas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo as TipoCategoria,
    color: fila.color,
    activa: fila.activa === 1,
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
