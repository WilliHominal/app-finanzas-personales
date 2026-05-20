import { useCallback, useEffect, useState } from "react";
import { formatearMonto, formatearMontoEntero } from "../../shared/formato";
import { listarMonedas, type GrupoMoneda, type Moneda } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import { BLOQUE_DE_TIPO, ORDEN_BLOQUES, type Cuenta } from "../cuentas/cuentas.tipos";
import { listarMovimientos } from "../movimientos/movimientos.repositorio";
import { listarCotizaciones } from "../parametros/cotizaciones.repositorio";
import { obtenerResumen } from "./resumen";
import "./dashboard.css";

const OPCIONES_CONSOLIDADO: { id: GrupoMoneda; etiqueta: string }[] = [
  { id: "Pesos", etiqueta: "Pesos" },
  { id: "Dolares", etiqueta: "USD" },
];

export function PantallaDashboard() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [saldos, setSaldos] = useState<Map<number, string>>(new Map());
  const [totalPesos, setTotalPesos] = useState("0");
  const [totalDolares, setTotalDolares] = useState("0");
  const [consolidadoPesos, setConsolidadoPesos] = useState("0");
  const [consolidadoDolares, setConsolidadoDolares] = useState("0");
  const [cotizacionesListas, setCotizacionesListas] = useState(false);
  const [monedaConsolidado, setMonedaConsolidado] = useState<GrupoMoneda>("Pesos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [todasLasCuentas, movimientos, listaMonedas, listaCotizaciones] =
        await Promise.all([
          listarCuentas(),
          listarMovimientos(),
          listarMonedas(),
          listarCotizaciones(),
        ]);
      const activas = todasLasCuentas.filter((c) => c.estado === "Activa");
      const codigoPorId = new Map(listaMonedas.map((m) => [m.id, m.codigo]));
      const cuentasParaResumen = activas.map((c) => ({
        id: c.id,
        moneda: codigoPorId.get(c.monedaId) ?? "",
      }));
      const financiero =
        listaCotizaciones.find((c) => c.nombre === "Dólar Financiero")?.valor ??
        "0";
      const cripto =
        listaCotizaciones.find((c) => c.nombre === "Dólar Cripto")?.valor ?? "0";

      const resumen = await obtenerResumen(cuentasParaResumen, movimientos, {
        financiero,
        cripto,
      });

      setCuentas(activas);
      setMonedas(listaMonedas);
      setSaldos(new Map(resumen.saldos.map((s) => [s.cuentaId, s.saldo])));
      setTotalPesos(resumen.totalPesos);
      setTotalDolares(resumen.totalDolares);
      setConsolidadoPesos(resumen.consolidadoPesos);
      setConsolidadoDolares(resumen.consolidadoDolares);
      setCotizacionesListas(Number(financiero) > 0 && Number(cripto) > 0);
    } catch (e) {
      setError(`No se pudo cargar el tablero: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function codigoMoneda(monedaId: number): string {
    return monedas.find((m) => m.id === monedaId)?.codigo ?? "";
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Dashboard</h2>
        <p>
          Tu patrimonio: cuánto tenés en pesos y en dólares, y el detalle por
          cuenta.
        </p>
      </header>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : cuentas.length === 0 ? (
        <p className="vacio">
          No hay cuentas activas. Creá una en la sección Cuentas.
        </p>
      ) : (
        <>
          <div className="resumen">
            <div className="resumen-izquierda">
              <div className="total">
                <span className="total-etiqueta">Total en Pesos</span>
                <span className="total-valor">
                  {formatearMontoEntero(totalPesos)} ARS
                </span>
              </div>
              <div className="total">
                <span className="total-etiqueta">Total en Dólares</span>
                <span className="total-valor">
                  {formatearMontoEntero(totalDolares)} USD
                </span>
              </div>
            </div>

            <div className="consolidado">
              <div className="consolidado-cabecera">
                <span className="consolidado-etiqueta">
                  Patrimonio consolidado
                </span>
                <div
                  className="switch"
                  role="group"
                  aria-label="Moneda del consolidado"
                >
                  {OPCIONES_CONSOLIDADO.map((opcion) => (
                    <button
                      key={opcion.id}
                      type="button"
                      className={
                        monedaConsolidado === opcion.id
                          ? "switch-opcion activa"
                          : "switch-opcion"
                      }
                      onClick={() => setMonedaConsolidado(opcion.id)}
                    >
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
              </div>
              <div className="consolidado-cuerpo">
                {cotizacionesListas ? (
                  <span className="consolidado-valor">
                    {monedaConsolidado === "Pesos"
                      ? `${formatearMontoEntero(consolidadoPesos)} ARS`
                      : `${formatearMontoEntero(consolidadoDolares)} USD`}
                  </span>
                ) : (
                  <span className="consolidado-vacio">
                    Cargá las cotizaciones para ver el patrimonio consolidado.
                  </span>
                )}
              </div>
            </div>
          </div>

          {ORDEN_BLOQUES.map((bloque) => {
            const cuentasDelBloque = cuentas.filter(
              (c) => BLOQUE_DE_TIPO[c.tipo] === bloque,
            );
            if (cuentasDelBloque.length === 0) return null;
            return (
              <div key={bloque} className="bloque">
                <h3 className="bloque-titulo">{bloque}</h3>
                <table className="tabla">
                  <tbody>
                    {cuentasDelBloque.map((cuenta) => (
                      <tr key={cuenta.id}>
                        <td>{cuenta.nombre}</td>
                        <td className="monto celda-saldo">
                          {formatearMonto(saldos.get(cuenta.id) ?? "0")}{" "}
                          {codigoMoneda(cuenta.monedaId)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}
