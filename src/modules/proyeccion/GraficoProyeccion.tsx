import { useEffect, useRef, useState, type MouseEvent } from "react";
import { formatearMontoEntero } from "../../shared/formato";
import { MESES } from "../recurrencia/recurrencia.tipos";
import type { PuntoProyeccion } from "./proyeccion.tipos";

interface Props {
  puntos: PuntoProyeccion[];
}

const ALTO = 280;
const M_IZQ = 52;
const M_DER = 20;
const M_ARR = 16;
const M_ABA = 34;
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
 * rebasadas a índice 100 para compararlas en un mismo eje. El `viewBox`
 * sigue el ancho real del contenedor, de modo que la altura queda fija y el
 * texto no se deforma. Muestra los valores reales al pasar el mouse.
 */
export function GraficoProyeccion({ puntos }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [ancho, setAncho] = useState(800);
  const [activo, setActivo] = useState<number | null>(null);

  useEffect(() => {
    const elemento = contenedorRef.current;
    if (!elemento) return;
    const observador = new ResizeObserver((entradas) => {
      setAncho(entradas[0].contentRect.width);
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  if (puntos.length < 2) return <div ref={contenedorRef} />;

  const nominal = indexar(puntos.map((p) => Number(p.patrimonioNominal)));
  const usd = indexar(puntos.map((p) => Number(p.patrimonioUsd)));
  const valores = [...nominal, ...usd];
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const rango = maximo - minimo || 1;

  const plotAncho = ancho - M_IZQ - M_DER;
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
    const x = ((evento.clientX - rect.left) / rect.width) * ancho;
    const indice = Math.round(((x - M_IZQ) / plotAncho) * (puntos.length - 1));
    setActivo(Math.max(0, Math.min(puntos.length - 1, indice)));
  }

  const anchoTip = 164;

  return (
    <div ref={contenedorRef}>
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
        viewBox={`0 0 ${ancho} ${ALTO}`}
        className="grafico-svg"
        onMouseMove={alMover}
        onMouseLeave={() => setActivo(null)}
      >
        {nivelesY.map((valor) => (
          <g key={valor}>
            <line
              x1={M_IZQ}
              y1={ejeY(valor)}
              x2={ancho - M_DER}
              y2={ejeY(valor)}
              className="grafico-grilla"
            />
            <text
              x={M_IZQ - 8}
              y={ejeY(valor) + 4}
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
            y={ALTO - M_ABA + 19}
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
              ancho - M_DER - anchoTip,
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
                  r="4"
                  fill={COLOR_NOMINAL}
                />
                <circle cx={cx} cy={ejeY(usd[activo])} r="4" fill={COLOR_USD} />
                <rect
                  x={tx}
                  y={ty}
                  width={anchoTip}
                  height="60"
                  rx="6"
                  className="grafico-tooltip"
                />
                <text x={tx + 12} y={ty + 19} className="grafico-tooltip-titulo">
                  {etiquetaMes(activo)}
                </text>
                <text x={tx + 12} y={ty + 37} className="grafico-tooltip-texto">
                  Nominal: $ {formatearMontoEntero(punto.patrimonioNominal)}
                </text>
                <text x={tx + 12} y={ty + 52} className="grafico-tooltip-texto">
                  USD: $ {formatearMontoEntero(punto.patrimonioUsd)}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}
