import { useState } from "react";
import { formatearMonto } from "../../shared/formato";
import { actualizarCotizacion } from "../parametros/cotizaciones.repositorio";
import type { Cotizacion } from "../parametros/cotizaciones.tipos";

interface Props {
  cotizaciones: Cotizacion[];
  onActualizada: () => void;
}

const ETIQUETA: Record<string, string> = {
  "Dólar Financiero": "Dólar MEP",
  "Dólar Cripto": "Dólar Cripto",
};

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Cotizaciones del dólar en el dashboard, con override manual por fila. */
export function PanelCotizaciones({ cotizaciones, onActualizada }: Props) {
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (cotizaciones.length === 0) return null;

  function empezarEdicion(cotizacion: Cotizacion) {
    setEditandoId(cotizacion.id);
    setValor(cotizacion.valor);
  }

  async function guardar(id: number) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return;
    setGuardando(true);
    try {
      await actualizarCotizacion(id, numero.toFixed(2));
      setEditandoId(null);
      onActualizada();
    } finally {
      setGuardando(false);
    }
  }

  const fecha =
    cotizaciones.find((c) => c.fechaActualizacion)?.fechaActualizacion ?? null;

  return (
    <div className="cotizaciones-panel">
      {cotizaciones.map((cotizacion) => (
        <div key={cotizacion.id} className="cotizacion-fila">
          <span className="cotizacion-nombre">
            {ETIQUETA[cotizacion.nombre] ?? cotizacion.nombre}
          </span>
          {editandoId === cotizacion.id ? (
            <>
              <input
                className="cotizacion-input"
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
              <button
                type="button"
                className="boton-tenue"
                disabled={guardando}
                onClick={() => guardar(cotizacion.id)}
              >
                Guardar
              </button>
              <button
                type="button"
                className="boton-tenue"
                onClick={() => setEditandoId(null)}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <span className="cotizacion-valor">
                $ {formatearMonto(cotizacion.valor)}
              </span>
              <button
                type="button"
                className="boton-tenue"
                onClick={() => empezarEdicion(cotizacion)}
              >
                Editar
              </button>
            </>
          )}
        </div>
      ))}
      <p className="cotizacion-fecha">
        Actualizado el {formatearFecha(fecha)}
      </p>
    </div>
  );
}
