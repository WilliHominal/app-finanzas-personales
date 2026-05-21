import { useCallback, useEffect, useState } from "react";
import { exportarRespaldo, listarRespaldos } from "./respaldo.servicio";

const RESPALDOS_CONSERVADOS = 14;

/** "finanzas-2026-05-21.db" → "21/05/2026". */
function fechaLegible(nombre: string): string {
  const partes = nombre.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!partes) return nombre;
  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

export function PantallaRespaldo() {
  const [respaldos, setRespaldos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      setRespaldos(await listarRespaldos());
    } catch (e) {
      setError(`No se pudieron cargar los respaldos: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function exportar() {
    setExportando(true);
    setError("");
    setResultado("");
    try {
      const ruta = await exportarRespaldo();
      setResultado(`Copia guardada en: ${ruta}`);
    } catch (e) {
      setError(`No se pudo exportar: ${e}`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Respaldo</h2>
        <p>
          Tus datos se respaldan solos cada día al abrir la app. Se conservan
          las últimas {RESPALDOS_CONSERVADOS} copias; las más viejas se
          descartan.
        </p>
      </header>

      <div className="formulario">
        <p className="formulario-titulo">Exportar una copia</p>
        <p className="nota">
          Guarda una copia del archivo de datos en tu carpeta de descargas,
          para llevarla a un pendrive o a la nube.
        </p>
        <button
          type="button"
          className="boton-primario"
          onClick={exportar}
          disabled={exportando}
        >
          {exportando ? "Exportando…" : "Exportar copia"}
        </button>
        {resultado && <p className="nota">{resultado}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : respaldos.length === 0 ? (
        <p className="vacio">Todavía no hay respaldos automáticos.</p>
      ) : (
        <>
          <h3 className="subtitulo">Respaldos automáticos</h3>
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha del respaldo</th>
              </tr>
            </thead>
            <tbody>
              {respaldos.map((nombre) => (
                <tr key={nombre}>
                  <td>{fechaLegible(nombre)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
