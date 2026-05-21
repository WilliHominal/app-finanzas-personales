const ENDPOINT_FINANCIERO = "https://dolarapi.com/v1/dolares/bolsa";
const ENDPOINT_CRIPTO = "https://dolarapi.com/v1/dolares/cripto";

interface RespuestaDolar {
  venta: number;
}

export interface CotizacionesRemotas {
  financiero: string;
  cripto: string;
}

async function ventaDe(url: string): Promise<string | null> {
  const respuesta = await fetch(url);
  if (!respuesta.ok) return null;
  const dato = (await respuesta.json()) as RespuestaDolar;
  if (typeof dato.venta !== "number" || dato.venta <= 0) return null;
  return dato.venta.toFixed(2);
}

/**
 * Trae las cotizaciones del dólar desde dolarapi.com: el financiero del
 * dólar MEP y el cripto del dólar cripto. Devuelve null ante cualquier
 * falla — sin conexión o respuesta inválida —, y así la app sigue con el
 * último valor cacheado.
 */
export async function obtenerCotizacionesRemotas(): Promise<CotizacionesRemotas | null> {
  try {
    const [financiero, cripto] = await Promise.all([
      ventaDe(ENDPOINT_FINANCIERO),
      ventaDe(ENDPOINT_CRIPTO),
    ]);
    if (financiero === null || cripto === null) return null;
    return { financiero, cripto };
  } catch {
    return null;
  }
}
