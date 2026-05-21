import { useEffect, useState } from "react";
import { formatearMontoEntero } from "../../shared/formato";
import { MESES } from "../recurrencia/recurrencia.tipos";
import { GraficoProyeccion } from "./GraficoProyeccion";
import { guardarSupuestos, obtenerSupuestos } from "./proyeccion.repositorio";
import { obtenerProyeccion } from "./proyeccion.servicio";
import {
  HORIZONTES,
  type Horizonte,
  type PuntoProyeccion,
} from "./proyeccion.tipos";
import "./proyeccion.css";

/** Etiqueta del mes calendario que está a `indice` meses de hoy. */
function etiquetaMes(indice: number): string {
  if (indice === 0) return "Hoy";
  const ahora = new Date();
  const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + indice, 1);
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

export function PantallaProyeccion() {
  const [horizonte, setHorizonte] = useState<Horizonte>(12);
  const [inflacion, setInflacion] = useState("0");
  const [rendimiento, setRendimiento] = useState("0");
  const [puntos, setPuntos] = useState<PuntoProyeccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function ejecutar(
    horizonteUsado: Horizonte,
    infl: string,
    rend: string,
  ) {
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
          <label htmlFor="proy-rendimiento">
            Rendimiento inversiones anual (%)
          </label>
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
      </div>

      {error && <p className="error">{error}</p>}

      {cargando && puntos.length === 0 ? (
        <p className="vacio">Calculando…</p>
      ) : puntos.length === 0 ? (
        <p className="vacio">No hay datos para proyectar.</p>
      ) : (
        <>
          <div className="grafico-proyeccion">
            <GraficoProyeccion puntos={puntos} />
          </div>

          <table className="tabla">
            <thead>
              <tr>
                <th>Mes</th>
                <th className="monto">Patrimonio nominal</th>
                <th className="monto">Valor en USD</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((punto) => (
                <tr key={punto.mes}>
                  <td>{etiquetaMes(punto.mes)}</td>
                  <td className="monto">
                    {formatearMontoEntero(punto.patrimonioNominal)} ARS
                  </td>
                  <td className="monto">
                    {formatearMontoEntero(punto.patrimonioUsd)} USD
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
