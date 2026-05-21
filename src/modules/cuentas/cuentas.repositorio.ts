import { obtenerDb } from "../../shared/db";
import type { Cuenta, EstadoCuenta, NuevaCuenta, TipoCuenta } from "./cuentas.tipos";

interface FilaCuenta {
  id: number;
  nombre: string;
  tipo: string;
  moneda_id: number;
  estado: string;
  usos: number;
}

/** Lista las cuentas; primero las activas, luego ordenadas por nombre. */
export async function listarCuentas(): Promise<Cuenta[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaCuenta[]>(
    `SELECT c.id, c.nombre, c.tipo, c.moneda_id, c.estado,
            (SELECT COUNT(*) FROM movimiento m
             WHERE m.cuenta_origen_id = c.id OR m.cuenta_destino_id = c.id) AS usos
     FROM cuenta c
     ORDER BY c.estado, c.nombre`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo as TipoCuenta,
    monedaId: fila.moneda_id,
    estado: fila.estado as EstadoCuenta,
    enUso: fila.usos > 0,
  }));
}

export async function crearCuenta(nueva: NuevaCuenta): Promise<number> {
  const db = await obtenerDb();
  const resultado = await db.execute(
    "INSERT INTO cuenta (nombre, tipo, moneda_id) VALUES ($1, $2, $3)",
    [nueva.nombre, nueva.tipo, nueva.monedaId],
  );
  return resultado.lastInsertId as number;
}

export async function actualizarCuenta(
  id: number,
  datos: NuevaCuenta,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    "UPDATE cuenta SET nombre = $1, tipo = $2, moneda_id = $3 WHERE id = $4",
    [datos.nombre, datos.tipo, datos.monedaId, id],
  );
}

export async function cambiarEstadoCuenta(
  id: number,
  estado: EstadoCuenta,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute("UPDATE cuenta SET estado = $1 WHERE id = $2", [estado, id]);
}

/** Elimina una cuenta. Solo es seguro si no tiene movimientos asociados. */
export async function eliminarCuenta(id: number): Promise<void> {
  const db = await obtenerDb();
  await db.execute("DELETE FROM cuenta WHERE id = $1", [id]);
}
