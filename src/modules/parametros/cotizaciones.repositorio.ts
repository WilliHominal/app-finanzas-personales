import { obtenerDb } from "../../shared/db";
import type { Cotizacion } from "./cotizaciones.tipos";

interface FilaCotizacion {
  id: number;
  nombre: string;
  valor: string;
  fecha_actualizacion: string | null;
}

export async function listarCotizaciones(): Promise<Cotizacion[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaCotizacion[]>(
    "SELECT id, nombre, valor, fecha_actualizacion FROM cotizacion ORDER BY id",
  );
  return filas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    valor: fila.valor,
    fechaActualizacion: fila.fecha_actualizacion,
  }));
}

export async function actualizarCotizacion(
  id: number,
  valor: string,
): Promise<void> {
  const db = await obtenerDb();
  const hoy = new Date().toISOString().slice(0, 10);
  await db.execute(
    "UPDATE cotizacion SET valor = $1, fecha_actualizacion = $2 WHERE id = $3",
    [valor, hoy, id],
  );
}
