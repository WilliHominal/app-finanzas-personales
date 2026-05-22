import { listarMonedas } from "../../shared/monedas";
import { crearInstrumento } from "../instrumentos/instrumentos.repositorio";
import { sincronizarPrecios } from "../instrumentos/instrumentos.servicio";
import { crearMovimiento } from "../movimientos/movimientos.repositorio";
import { crearCuenta } from "./cuentas.repositorio";

interface NuevaTenencia {
  nombre: string;
  simbolo: string;
  cantidadInicial: string;
  fecha: string;
}

/**
 * Da de alta una tenencia de un instrumento bursátil: asegura el instrumento
 * como unidad, crea la cuenta de inversión, registra la cantidad inicial
 * como una Apertura — sin contrapartida, no mueve plata de ninguna cuenta —
 * y sincroniza precios para que la tenencia tenga valor de inmediato.
 */
export async function crearTenencia(datos: NuevaTenencia): Promise<void> {
  const simbolo = datos.simbolo.trim().toUpperCase();

  const monedas = await listarMonedas();
  const existente = monedas.find(
    (moneda) => moneda.tipo === "Instrumento" && moneda.codigo === simbolo,
  );
  const instrumentoId = existente
    ? existente.id
    : await crearInstrumento(simbolo);

  const cuentaId = await crearCuenta({
    nombre: datos.nombre.trim(),
    tipo: "InversionesLargoPlazo",
    monedaId: instrumentoId,
  });

  await crearMovimiento({
    fecha: datos.fecha,
    descripcion: `Tenencia inicial · ${simbolo}`,
    tipo: "Apertura",
    cuentaOrigenId: null,
    cuentaDestinoId: cuentaId,
    montoOrigen: null,
    montoDestino: datos.cantidadInicial,
    categoriaId: null,
    reglaRecurrenteId: null,
  });

  // Un instrumento recién creado entra sin precio: hasta acá la tenencia
  // valdría cero en el dashboard. Sincronizamos ahora para no depender del
  // próximo arranque de la app. Si falla (sin conexión), no rompe el alta:
  // sincronizarPrecios se traga sus errores y el arranque siguiente reintenta.
  await sincronizarPrecios();
}
