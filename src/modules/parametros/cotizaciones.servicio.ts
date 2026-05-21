import { obtenerCotizacionesRemotas } from "./cotizaciones.api";
import {
  actualizarCotizacion,
  listarCotizaciones,
} from "./cotizaciones.repositorio";

const NOMBRE_FINANCIERO = "Dólar Financiero";
const NOMBRE_CRIPTO = "Dólar Cripto";

/**
 * Sincroniza las cotizaciones con dolarapi.com y las cachea en la base.
 * Si no hay conexión no toca nada: la app sigue con el último valor
 * guardado. Devuelve true solo si logró actualizar.
 */
export async function sincronizarCotizaciones(): Promise<boolean> {
  const remotas = await obtenerCotizacionesRemotas();
  if (remotas === null) return false;

  const cotizaciones = await listarCotizaciones();
  const financiero = cotizaciones.find((c) => c.nombre === NOMBRE_FINANCIERO);
  const cripto = cotizaciones.find((c) => c.nombre === NOMBRE_CRIPTO);

  if (financiero) await actualizarCotizacion(financiero.id, remotas.financiero);
  if (cripto) await actualizarCotizacion(cripto.id, remotas.cripto);
  return true;
}
