import { useCallback, useEffect, useMemo, useState } from "react";
import { formatearMonto } from "../../shared/formato";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { FormularioTna } from "./FormularioTna";
import { eliminarTramo, listarTramos } from "./rendimientos.repositorio";
import {
  obtenerRendimientos,
  type RendimientoVista,
} from "./rendimientos.servicio";
import type { TramoTna } from "./rendimientos.tipos";

export function PantallaRendimientos() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tramos, setTramos] = useState<TramoTna[]>([]);
  const [rendimientos, setRendimientos] = useState<RendimientoVista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [listaCuentas, listaTramos, listaRendimientos] = await Promise.all([
        listarCuentas(),
        listarTramos(),
        obtenerRendimientos(),
      ]);
      setCuentas(listaCuentas);
      setTramos(listaTramos);
      setRendimientos(listaRendimientos);
    } catch (e) {
      setError(`No se pudieron cargar los rendimientos: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const remuneradas = useMemo(
    () =>
      cuentas.filter((c) => c.tipo === "Remunerada" && c.estado === "Activa"),
    [cuentas],
  );

  function nombreCuenta(id: number): string {
    return cuentas.find((c) => c.id === id)?.nombre ?? "—";
  }

  async function borrarTramo(id: number) {
    await eliminarTramo(id);
    cargar();
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Rendimientos</h2>
        <p>
          Cargá la TNA de tus cuentas remuneradas. El interés se acredita
          solo, día a día, y se proyecta el rinde a fin de mes.
        </p>
      </header>

      {remuneradas.length === 0 ? (
        <p className="vacio">
          No tenés cuentas remuneradas activas. Creá una en la sección Cuentas.
        </p>
      ) : (
        <FormularioTna cuentas={remuneradas} onGuardado={cargar} />
      )}

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : rendimientos.length === 0 ? (
        <p className="vacio">Todavía no hay rendimientos para mostrar.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th className="monto">Saldo</th>
              <th className="monto">TNA</th>
              <th className="monto">Interés proyectado</th>
              <th className="monto">Saldo a fin de mes</th>
            </tr>
          </thead>
          <tbody>
            {rendimientos.map((rendimiento) => (
              <tr key={rendimiento.cuentaId}>
                <td>{rendimiento.nombre}</td>
                <td className="monto">{formatearMonto(rendimiento.saldo)}</td>
                <td className="monto">
                  {rendimiento.tnaVigente ? `${rendimiento.tnaVigente}%` : "—"}
                </td>
                <td className="monto ingreso">
                  {formatearMonto(rendimiento.interesProyectadoFinMes)}
                </td>
                <td className="monto">
                  {formatearMonto(rendimiento.saldoProyectadoFinMes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tramos.length > 0 && (
        <>
          <h3 className="subtitulo">Historial de tasas</h3>
          <table className="tabla">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Vigente desde</th>
                <th className="monto">TNA</th>
                <th aria-label="Acciones"></th>
              </tr>
            </thead>
            <tbody>
              {tramos.map((tramo) => (
                <tr key={tramo.id}>
                  <td>{nombreCuenta(tramo.cuentaId)}</td>
                  <td>{tramo.vigenciaDesde}</td>
                  <td className="monto">{tramo.tna}%</td>
                  <td>
                    <div className="acciones">
                      <button
                        type="button"
                        className="boton-tenue"
                        onClick={() => borrarTramo(tramo.id)}
                      >
                        Borrar
                      </button>
                    </div>
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
