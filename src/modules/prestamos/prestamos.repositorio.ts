import { obtenerDb } from "../../shared/db";
import type { TipoCuenta } from "../cuentas/cuentas.tipos";
import type { Prestamo, TipoPrestamo } from "./prestamos.tipos";

interface FilaPrestamo {
  id: number;
  cuenta_id: number;
  contraparte: string;
  capital: string;
  fecha: string;
  notas: string | null;
  tipo_cuenta: string;
}

function tipoPrestamoDe(tipoCuenta: string): TipoPrestamo {
  return tipoCuenta === "PrestamoRecibido" ? "Recibido" : "Otorgado";
}

export async function listarPrestamos(): Promise<Prestamo[]> {
  const db = await obtenerDb();
  const filas = await db.select<FilaPrestamo[]>(
    `SELECT p.id, p.cuenta_id, p.contraparte, p.capital, p.fecha, p.notas,
            c.tipo AS tipo_cuenta
     FROM prestamo p
     JOIN cuenta c ON c.id = p.cuenta_id
     ORDER BY p.fecha DESC, p.id DESC`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    cuentaId: fila.cuenta_id,
    contraparte: fila.contraparte,
    capital: fila.capital,
    fecha: fila.fecha,
    notas: fila.notas,
    tipo: tipoPrestamoDe(fila.tipo_cuenta),
  }));
}

/** Crea la cuenta que representa el préstamo y devuelve su id. */
export async function crearCuentaPrestamo(
  nombre: string,
  tipo: TipoCuenta,
  monedaId: number,
): Promise<number> {
  const db = await obtenerDb();
  const resultado = await db.execute(
    "INSERT INTO cuenta (nombre, tipo, moneda_id) VALUES ($1, $2, $3)",
    [nombre, tipo, monedaId],
  );
  return resultado.lastInsertId as number;
}

export async function insertarPrestamo(
  cuentaId: number,
  contraparte: string,
  capital: string,
  fecha: string,
  notas: string | null,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    `INSERT INTO prestamo (cuenta_id, contraparte, capital, fecha, notas)
     VALUES ($1, $2, $3, $4, $5)`,
    [cuentaId, contraparte, capital, fecha, notas],
  );
}

/**
 * Elimina un préstamo por completo: sus movimientos, la cuenta que lo
 * representa y su metadata. Revierte el préstamo como si no hubiera ocurrido.
 */
export async function eliminarPrestamo(
  id: number,
  cuentaId: number,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute(
    "DELETE FROM movimiento WHERE cuenta_origen_id = $1 OR cuenta_destino_id = $1",
    [cuentaId],
  );
  await db.execute("DELETE FROM prestamo WHERE id = $1", [id]);
  await db.execute("DELETE FROM cuenta WHERE id = $1", [cuentaId]);
}
