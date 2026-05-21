import { useEffect, useState } from "react";
import { formatearMontoEntero } from "../../shared/formato";
import { MESES } from "../recurrencia/recurrencia.tipos";
import { guardarSupuestos, obtenerSupuestos } from "./proyeccion.repositorio";
import { obtenerProyeccion } from "./proyeccion.servicio";
import {
  HORIZONTES,
  type Horizonte,
  type PuntoProyeccion,
} from "./proyeccion.tipos";
import "./proyeccion.css";

type Modo = "nominal" | "real";

const ANCHO_GRAFICO = 600;
const ALTO_GRAFICO = 130;

/** Etiqueta del mes calendario que está a `indice` meses de hoy. */
function etiquetaMes(indice: number): string {
  if (indice === 0) return "Hoy";
  const ahora = new Date();
  const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + indice, 1);
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

/** Arma los puntos de la polilínea del gráfico, escalados al recuadro. */
function lineaDelGrafico(valores: number[]): string {
  if (valores.length < 2) return "";
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const rango = maximo - minimo || 1;
  return valores
    .map((valor, indice) => {
      const x = (indice / (valores.length - 1)) * ANCHO_GRAFICO;
      const y = ALTO_GRAFICO - ((valor - minimo) / rango) * ALTO_GRAFICO;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function PantallaProyeccion() {
  const [horizonte, setHorizonte] = useState<Horizonte>(12);
  const [modo, setModo] = useState<Modo>("nominal");
  const [inflacion, setInflacion] = useState("0");
  const [rendimiento, setRendimiento] = useState("0");
  const [puntos, setPuntos] = useState<PuntoProyeccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function ejecutar(horizonteUsado: Horizonte, infl: string, rend: string) {
    setCargando(true);
    setError("");
    try {
      const supuestos = {
        inflacionAnual: infl,
        rendimientoInversionesAnual: rend,
      };
      await guardarSupuestos(supuestos);
      setPuntos(await obtenerProyeccion(horizonteUsado, supuestos));
    } catch (e) {
      setError(`No se pudo calcular la proyección: ${e}`);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    async function iniciar() {
      try {
        const supuestos = await obtenerSupuestos();
        setInflacion(supuestos.inflacionAnual);
        setRendimiento(supuestos.rendimientoInversionesAnual);
        setPuntos(await obtenerProyeccion(12, supuestos));
      } catch (e) {
        setError(`No se pudo calcular la proyección: ${e}`);
      } finally {
        setCargando(false);
      }
    }
    iniciar();
  }, []);

  function cambiarHorizonte(nuevo: Horizonte) {
    setHorizonte(nuevo);
    ejecutar(nuevo, inflacion, rendimiento);
  }

  const valores = puntos.map((punto) =>
    Number(modo === "nominal" ? punto.patrimonioNominal : punto.patrimonioReal),
  );

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Proyección</h2>
        <p>
          Cuánto patrimonio vas a tener si todo sigue su curso. Es un cálculo
          sobre supuestos, no un hecho: se recalcula cada vez y nunca se
          guarda.
        </p>
      </header>

      <div className="proyeccion-controles">
        <div className="grupo-control">
          <span>Horizonte</span>
          <div className="botones-segmentados">
            {HORIZONTES.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className={
                  opcion === horizonte
                    ? "boton-segmento activo"
                    : "boton-segmento"
                }
                onClick={() => cambiarHorizonte(opcion)}
              >
                {opcion} meses
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <label htmlFor="proy-inflacion">Inflación anual (%)</label>
          <input
            id="proy-inflacion"
            type="number"
            step="0.1"
            min="0"
            value={inflacion}
            onChange={(e) => setInflacion(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="proy-rendimiento">Rendimiento inversiones (%)</label>
          <input
            id="proy-rendimiento"
            type="number"
            step="0.1"
            min="0"
            value={rendimiento}
            onChange={(e) => setRendimiento(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="boton-primario"
          onClick={() => ejecutar(horizonte, inflacion, rendimiento)}
          disabled={cargando}
        >
          {cargando ? "Calculando…" : "Recalcular"}
        </button>

        <div className="grupo-control">
          <span>Vista</span>
          <div className="botones-segmentados">
            <button
              type="button"
              className={
                modo === "nominal" ? "boton-segmento activo" : "boton-segmento"
              }
              onClick={() => setModo("nominal")}
            >
              Nominal
            </button>
            <button
              type="button"
              className={
                modo === "real" ? "boton-segmento activo" : "boton-segmento"
              }
              onClick={() => setModo("real")}
            >
              Pesos de hoy
            </button>
          </div>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {cargando && puntos.length === 0 ? (
        <p className="vacio">Calculando…</p>
      ) : puntos.length === 0 ? (
        <p className="vacio">No hay datos para proyectar.</p>
      ) : (
        <>
          <div className="grafico-proyeccion">
            <svg
              viewBox={`0 0 ${ANCHO_GRAFICO} ${ALTO_GRAFICO}`}
              preserveAspectRatio="none"
            >
              <polyline
                points={lineaDelGrafico(valores)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <table className="tabla">
            <thead>
              <tr>
                <th>Mes</th>
                <th className="monto">
                  Patrimonio {modo === "nominal" ? "nominal" : "en pesos de hoy"}
                </th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((punto) => (
                <tr key={punto.mes}>
                  <td>{etiquetaMes(punto.mes)}</td>
                  <td className="monto">
                    {formatearMontoEntero(
                      modo === "nominal"
                        ? punto.patrimonioNominal
                        : punto.patrimonioReal,
                    )}{" "}
                    ARS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
