const ENDPOINT_MEP = "https://dolarapi.com/v1/dolares/bolsa";
const ENDPOINT_FIWIND = "https://criptoya.com/api/fiwind/usdt/ars";

interface RespuestaDolarApi {
  venta: number;
}

interface RespuestaCriptoya {
  ask: number;
}

export interface CotizacionesRemotas {
  financiero: string;
  cripto: string;
}

function precioValido(valor: unknown): valor is number {
  return typeof valor === "number" && valor > 0;
}

/** Dólar MEP desde dolarapi.com: usa el precio de venta. */
async function precioMep(): Promise<string | null> {
  const respuesta = await fetch(ENDPOINT_MEP);
  if (!respuesta.ok) return null;
  const dato = (await respuesta.json()) as RespuestaDolarApi;
  return precioValido(dato.venta) ? dato.venta.toFixed(2) : null;
}

/**
 * Dólar cripto del exchange Fiwind, vía criptoya.com. Usa el precio `ask`
 * — el de venta, mismo criterio que el MEP.
 */
async function precioFiwind(): Promise<string | null> {
  const respuesta = await fetch(ENDPOINT_FIWIND);
  if (!respuesta.ok) return null;
  const dato = (await respuesta.json()) as RespuestaCriptoya;
  return precioValido(dato.ask) ? dato.ask.toFixed(2) : null;
}

/**
 * Trae las cotizaciones del dólar: el financiero del dólar MEP
 * (dolarapi.com) y el cripto de Fiwind (criptoya.com). Devuelve null ante
 * cualquier falla — sin conexión o respuesta inválida —, y así la app
 * sigue con el último valor cacheado.
 */
export async function obtenerCotizacionesRemotas(): Promise<CotizacionesRemotas | null> {
  try {
    const [financiero, cripto] = await Promise.all([
      precioMep(),
      precioFiwind(),
    ]);
    if (financiero === null || cripto === null) return null;
    return { financiero, cripto };
  } catch {
    return null;
  }
}
