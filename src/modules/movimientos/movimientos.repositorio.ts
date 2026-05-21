import { obtenerDb } from "../../shared/db";
import type { Movimiento, NuevoMovimiento, TipoMovimiento } from "./movimientos.tipos";

interface FilaMovimiento {
  id: number;
  fecha: string;
  descripcion: string;
  tipo: string;
  cuenta_origen_id: number | null;
  cuenta_destino_id: number | null;
  monto_origen: string | null;
  monto_destino: string | null;
  categoria_id: number | null;
  regla_recurrente_id: number | null;
}

export async function listarMovimientos(): Promise<Movimiento[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaMovimiento[]>(
    `SELECT id, fecha, descripcion, tipo, cuenta_origen_id, cuenta_destino_id,
            monto_origen, monto_destino, categoria_id, regla_recurrente_id
     FROM movimiento
     ORDER BY fecha DESC, id DESC`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    fecha: fila.fecha,
    descripcion: fila.descripcion,
    tipo: fila.tipo as TipoMovimiento,
    cuentaOrigenId: fila.cuenta_origen_id,
    cuentaDestinoId: fila.cuenta_destino_id,
    montoOrigen: fila.monto_origen,
    montoDestino: fila.monto_destino,
    categoriaId: fila.categoria_id,
    reglaRecurrenteId: fila.regla_recurrente_id,
  }));
}

export async function crearMovimiento(nuevo: NuevoMovimiento): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    `INSERT INTO movimiento
       (fecha, descripcion, tipo, cuenta_origen_id, cuenta_destino_id,
        monto_origen, monto_destino, categoria_id, regla_recurrente_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      nuevo.fecha,
      nuevo.descripcion,
      nuevo.tipo,
      nuevo.cuentaOrigenId,
      nuevo.cuentaDestinoId,
      nuevo.montoOrigen,
      nuevo.montoDestino,
      nuevo.categoriaId,
      nuevo.reglaRecurrenteId,
    ],
  );
}

export async function actualizarMovimiento(
  id: number,
  datos: NuevoMovimiento,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    `UPDATE movimiento SET
       fecha = $1, descripcion = $2, tipo = $3, cuenta_origen_id = $4,
       cuenta_destino_id = $5, monto_origen = $6, monto_destino = $7,
       categoria_id = $8
     WHERE id = $9`,
    [
      datos.fecha,
      datos.descripcion,
      datos.tipo,
      datos.cuentaOrigenId,
      datos.cuentaDestinoId,
      datos.montoOrigen,
      datos.montoDestino,
      datos.categoriaId,
      id,
    ],
  );
}

export async function eliminarMovimiento(id: number): Promise<void> {
  const db = await obtenerDb();
  await db.execute("DELETE FROM movimiento WHERE id = $1", [id]);
}
