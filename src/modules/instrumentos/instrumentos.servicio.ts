import { obtenerPreciosCedears } from "./instrumentos.api";
import {
  actualizarPrecioInstrumento,
  listarInstrumentos,
} from "./instrumentos.repositorio";

/**
 * Sincroniza el precio de los instrumentos cargados con data912.com. Si no
 * hay instrumentos, no toca la red. Cualquier falla se traga a propósito:
 * un problema de precios no debe impedir el arranque de la app.
 */
export async function sincronizarPrecios(): Promise<boolean> {
  try {
    const instrumentos = await listarInstrumentos();
    if (instrumentos.length === 0) return true;

    const precios = await obtenerPreciosCedears();
    if (precios === null) return false;

    const precioPorSimbolo = new Map(
      precios.map((precio) => [precio.simbolo, precio.precio]),
    );
    for (const instrumento of instrumentos) {
      const precio = precioPorSimbolo.get(instrumento.codigo);
      if (precio) {
        await actualizarPrecioInstrumento(instrumento.id, precio);
      }
    }
    return true;
  } catch {
    return false;
  }
}
