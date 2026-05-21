const ENDPOINT_CEDEARS = "https://data912.com/live/arg_cedears";

interface CedearRemoto {
  symbol: string;
  c: number;
}

export interface PrecioCedear {
  simbolo: string;
  precio: string;
}

/**
 * Trae de data912.com el precio de cierre, en pesos, de todos los CEDEARs
 * del mercado argentino. Devuelve null ante cualquier falla —sin conexión o
 * respuesta inválida— y así la app sigue con el último precio cacheado.
 */
export async function obtenerPreciosCedears(): Promise<PrecioCedear[] | null> {
  try {
    const respuesta = await fetch(ENDPOINT_CEDEARS);
    if (!respuesta.ok) return null;
    const datos = (await respuesta.json()) as CedearRemoto[];
    return datos
      .filter(
        (dato) => typeof dato.c === "number" && dato.c > 0 && Boolean(dato.symbol),
      )
      .map((dato) => ({ simbolo: dato.symbol, precio: dato.c.toFixed(2) }));
  } catch {
    return null;
  }
}
