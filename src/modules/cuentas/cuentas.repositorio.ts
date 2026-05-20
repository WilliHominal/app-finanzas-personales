import { obtenerDb } from "../../shared/db";
import type { Cuenta, EstadoCuenta, NuevaCuenta, TipoCuenta } from "./cuentas.tipos";

interface FilaCuenta {
  id: number;
  nombre: string;
  tipo: string;
  moneda_id: number;
  estado: string;
}

/** Lista las cuentas; primero las activas, luego ordenadas por nombre. */
export async function listarCuentas(): Promise<Cuenta[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaCuenta[]>(
    "SELECT id, nombre, tipo, moneda_id, estado FROM cuenta ORDER BY estado, nombre",
  );
  return filas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo as TipoCuenta,
    monedaId: fila.moneda_id,
    estado: fila.estado as EstadoCuenta,
  }));
}

export async function crearCuenta(nueva: NuevaCuenta): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    "INSERT INTO cuenta (nombre, tipo, moneda_id) VALUES ($1, $2, $3)",
    [nueva.nombre, nueva.tipo, nueva.monedaId],
  );
}

export async function cambiarEstadoCuenta(
  id: number,
  estado: EstadoCuenta,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute("UPDATE cuenta SET estado = $1 WHERE id = $2", [estado, id]);
}
