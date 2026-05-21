import { obtenerDb } from "../../shared/db";
import type { SupuestosProyeccion } from "./proyeccion.tipos";

interface FilaParametro {
  clave: string;
  valor: string;
}

const CLAVE_INFLACION = "inflacion_anual";
const CLAVE_RENDIMIENTO = "rendimiento_inversiones_anual";

export async function obtenerSupuestos(): Promise<SupuestosProyeccion> {
  const db = await obtenerDb();
  const filas = await db.select<FilaParametro[]>(
    "SELECT clave, valor FROM parametro",
  );
  const valores = new Map(filas.map((fila) => [fila.clave, fila.valor]));
  return {
    inflacionAnual: valores.get(CLAVE_INFLACION) ?? "0",
    rendimientoInversionesAnual: valores.get(CLAVE_RENDIMIENTO) ?? "0",
  };
}

export async function guardarSupuestos(
  supuestos: SupuestosProyeccion,
): Promise<void> {
  const db = await obtenerDb();
  await db.execute("UPDATE parametro SET valor = $1 WHERE clave = $2", [
    supuestos.inflacionAnual,
    CLAVE_INFLACION,
  ]);
  await db.execute("UPDATE parametro SET valor = $1 WHERE clave = $2", [
    supuestos.rendimientoInversionesAnual,
    CLAVE_RENDIMIENTO,
  ]);
}
