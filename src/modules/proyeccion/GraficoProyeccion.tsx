import { useRef, useState, type MouseEvent } from "react";
import { formatearMontoEntero } from "../../shared/formato";
import { MESES } from "../recurrencia/recurrencia.tipos";
import type { PuntoProyeccion } from "./proyeccion.tipos";

interface Props {
  puntos: PuntoProyeccion[];
}

const ANCHO = 640;
const ALTO = 240;
const M_IZQ = 46;
const M_DER = 16;
const M_ARR = 16;
const M_ABA = 30;
const COLOR_NOMINAL = "var(--accent)";
const COLOR_USD = "#6b8aa6";

/** Etiqueta corta del mes que está a `indice` meses de hoy. */
function etiquetaMes(indice: number): string {
  if (indice === 0) return "Hoy";
  const ahora = new Date();
  const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + indice, 1);
  const anio = String(fecha.getFullYear()).slice(2);
  return `${MESES[fecha.getMonth()].slice(0, 3)} ${anio}`;
}

/** Rebasa una serie a índice 100 en su primer valor. */
function indexar(valores: number[]): number[] {
  const base = valores[0] || 1;
  return valores.map((valor) => (valor / base) * 100);
}

/**
 * Gráfico de la proyección: dos curvas —patrimonio nominal y valor en USD—
 * rebasadas a índice 100 para compararlas en un mismo eje. Muestra los
 * valores reales al pasar el mouse.
 */
export function GraficoProyeccion({ puntos }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activo, setActivo] = useState<number | null>(null);

  if (puntos.length < 2) return null;

  const nominal = indexar(puntos.map((p) => Number(p.patrimonioNominal)));
  const usd = indexar(puntos.map((p) => Number(p.patrimonioUsd)));
  const valores = [...nominal, ...usd];
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const rango = maximo - minimo || 1;

  const plotAncho = ANCHO - M_IZQ - M_DER;
  const plotAlto = ALTO - M_ARR - M_ABA;
  const ejeX = (i: number) => M_IZQ + (i / (puntos.length - 1)) * plotAncho;
  const ejeY = (valor: number) =>
    M_ARR + plotAlto - ((valor - minimo) / rango) * plotAlto;

  const trazo = (serie: number[]) =>
    serie.map((v, i) => `${ejeX(i).toFixed(1)},${ejeY(v).toFixed(1)}`).join(" ");

  const nivelesY = [0, 1, 2, 3, 4].map((k) => minimo + (rango * k) / 4);
  const pasoX = Math.max(1, Math.ceil((puntos.length - 1) / 5));
  const indicesX = puntos
    .map((_, i) => i)
    .filter((i) => i % pasoX === 0 || i === puntos.length - 1);

  function alMover(evento: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((evento.clientX - rect.left) / rect.width) * ANCHO;
    const indice = Math.round(((x - M_IZQ) / plotAncho) * (puntos.length - 1));
    setActivo(Math.max(0, Math.min(puntos.length - 1, indice)));
  }

  const anchoTip = 162;

  return (
    <>
      <div className="grafico-leyenda">
        <span className="leyenda-item">
          <span className="leyenda-punto" style={{ background: COLOR_NOMINAL }} />
          Patrimonio nominal
        </span>
        <span className="leyenda-item">
          <span className="leyenda-punto" style={{ background: COLOR_USD }} />
          Valor en USD
        </span>
        <span className="leyenda-nota">índice base 100 = hoy</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="grafico-svg"
        onMouseMove={alMover}
        onMouseLeave={() => setActivo(null)}
      >
        {nivelesY.map((valor) => (
          <g key={valor}>
            <line
              x1={M_IZQ}
              y1={ejeY(valor)}
              x2={ANCHO - M_DER}
              y2={ejeY(valor)}
              className="grafico-grilla"
            />
            <text
              x={M_IZQ - 7}
              y={ejeY(valor) + 3.5}
              textAnchor="end"
              className="grafico-eje"
            >
              {valor.toFixed(0)}
            </text>
          </g>
        ))}

        {indicesX.map((i) => (
          <text
            key={i}
            x={ejeX(i)}
            y={ALTO - M_ABA + 17}
            textAnchor="middle"
            className="grafico-eje"
          >
            {etiquetaMes(i)}
          </text>
        ))}

        <polyline
          points={trazo(nominal)}
          className="grafico-linea"
          stroke={COLOR_NOMINAL}
        />
        <polyline
          points={trazo(usd)}
          className="grafico-linea"
          stroke={COLOR_USD}
        />

        {activo !== null &&
          (() => {
            const cx = ejeX(activo);
            const tx = Math.min(
              Math.max(cx + 10, M_IZQ),
              ANCHO - M_DER - anchoTip,
            );
            const ty = M_ARR + 4;
            const punto = puntos[activo];
            return (
              <g>
                <line
                  x1={cx}
                  y1={M_ARR}
                  x2={cx}
                  y2={ALTO - M_ABA}
                  className="grafico-guia"
                />
                <circle
                  cx={cx}
                  cy={ejeY(nominal[activo])}
                  r="3.5"
                  fill={COLOR_NOMINAL}
                />
                <circle
                  cx={cx}
                  cy={ejeY(usd[activo])}
                  r="3.5"
                  fill={COLOR_USD}
                />
                <rect
                  x={tx}
                  y={ty}
                  width={anchoTip}
                  height="58"
                  rx="6"
                  className="grafico-tooltip"
                />
                <text
                  x={tx + 11}
                  y={ty + 18}
                  className="grafico-tooltip-titulo"
                >
                  {etiquetaMes(activo)}
                </text>
                <text
                  x={tx + 11}
                  y={ty + 35}
                  className="grafico-tooltip-texto"
                >
                  Nominal: $ {formatearMontoEntero(punto.patrimonioNominal)}
                </text>
                <text
                  x={tx + 11}
                  y={ty + 50}
                  className="grafico-tooltip-texto"
                >
                  USD: $ {formatearMontoEntero(punto.patrimonioUsd)}
                </text>
              </g>
            );
          })()}
      </svg>
    </>
  );
}
