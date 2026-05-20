import { useCallback, useEffect, useState, type FormEvent } from "react";
import { actualizarCotizacion, listarCotizaciones } from "./cotizaciones.repositorio";
import type { Cotizacion } from "./cotizaciones.tipos";
import { Calculadora } from "./Calculadora";

interface EditorProps {
  cotizacion: Cotizacion;
  onActualizada: () => void;
}

function EditorCotizacion({ cotizacion, onActualizada }: EditorProps) {
  const [valor, setValor] = useState(cotizacion.valor);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    try {
      await actualizarCotizacion(cotizacion.id, valor.trim() || "0");
      onActualizada();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={guardar}>
      <div className="campo campo-ancho">
        <label htmlFor={`cotizacion-${cotizacion.id}`}>{cotizacion.nombre}</label>
        <input
          id={`cotizacion-${cotizacion.id}`}
          type="number"
          step="0.01"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
      <span className="nota">
        {cotizacion.fechaActualizacion
          ? `Actualizado el ${cotizacion.fechaActualizacion}`
          : "Sin actualizar todavía"}
      </span>
    </form>
  );
}

export function PantallaCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      setCotizaciones(await listarCotizaciones());
    } catch (e) {
      setError(`No se pudieron cargar las cotizaciones: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Cotizaciones</h2>
        <p>
          El valor del dólar para la calculadora de conversión. Lo cargás a
          mano: la aplicación no consulta el mercado.
        </p>
      </header>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : (
        <>
          {cotizaciones.map((cotizacion) => (
            <EditorCotizacion
              key={cotizacion.id}
              cotizacion={cotizacion}
              onActualizada={cargar}
            />
          ))}
          <Calculadora cotizaciones={cotizaciones} />
        </>
      )}
    </section>
  );
}
