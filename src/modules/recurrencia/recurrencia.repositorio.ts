import { obtenerDb } from "../../shared/db";
import type {
  ModoRegla,
  NuevaRegla,
  ReglaRecurrente,
  TipoRegla,
} from "./recurrencia.tipos";

interface FilaRegla {
  id: number;
  tipo: string;
  descripcion: string;
  monto: string;
  cuenta_id: number;
  categoria_id: number | null;
  dia_aplicacion: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  modo: string;
  activa: number;
}

export async function listarReglas(): Promise<ReglaRecurrente[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaRegla[]>(
    `SELECT id, tipo, descripcion, monto, cuenta_id, categoria_id,
            dia_aplicacion, vigencia_desde, vigencia_hasta, modo, activa
     FROM regla_recurrente
     ORDER BY activa DESC, descripcion`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    tipo: fila.tipo as TipoRegla,
    descripcion: fila.descripcion,
    monto: fila.monto,
    cuentaId: fila.cuenta_id,
    categoriaId: fila.categoria_id,
    diaAplicacion: fila.dia_aplicacion,
    vigenciaDesde: fila.vigencia_desde,
    vigenciaHasta: fila.vigencia_hasta,
    modo: fila.modo as ModoRegla,
    activa: fila.activa === 1,
  }));
}

export async function crearRegla(nueva: NuevaRegla): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    `INSERT INTO regla_recurrente
       (tipo, descripcion, monto, cuenta_id, categoria_id, dia_aplicacion,
        vigencia_desde, vigencia_hasta, modo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      nueva.tipo,
      nueva.descripcion,
      nueva.monto,
      nueva.cuentaId,
      nueva.categoriaId,
      nueva.diaAplicacion,
      nueva.vigenciaDesde,
      nueva.vigenciaHasta,
      nueva.modo,
    ],
  );
}

export async function actualizarRegla(
  id: number,
  datos: NuevaRegla,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    `UPDATE regla_recurrente SET
       tipo = $1, descripcion = $2, monto = $3, cuenta_id = $4,
       categoria_id = $5, dia_aplicacion = $6, vigencia_desde = $7,
       vigencia_hasta = $8, modo = $9
     WHERE id = $10`,
    [
      datos.tipo,
      datos.descripcion,
      datos.monto,
      datos.cuentaId,
      datos.categoriaId,
      datos.diaAplicacion,
      datos.vigenciaDesde,
      datos.vigenciaHasta,
      datos.modo,
      id,
    ],
  );
}

export async function cambiarEstadoRegla(
  id: number,
  activa: boolean,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute("UPDATE regla_recurrente SET activa = $1 WHERE id = $2", [
    activa ? 1 : 0,
    id,
  ]);
}

export async function eliminarRegla(id: number): Promise<void> {
  const db = await obtenerDb();
  await db.execute("DELETE FROM regla_recurrente WHERE id = $1", [id]);
}
