import { useCallback, useEffect, useState } from "react";
import { listarMonedas, type Moneda } from "../../shared/monedas";
import {
  cambiarEstadoCuenta,
  eliminarCuenta,
  listarCuentas,
} from "./cuentas.repositorio";
import { ETIQUETA_TIPO, type Cuenta, type EstadoCuenta } from "./cuentas.tipos";
import { FormularioCuenta } from "./FormularioCuenta";

export function PantallaCuentas() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [cuentaEnEdicion, setCuentaEnEdicion] = useState<Cuenta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [listaCuentas, listaMonedas] = await Promise.all([
        listarCuentas(),
        listarMonedas(),
      ]);
      setCuentas(listaCuentas);
      setMonedas(listaMonedas);
    } catch (e) {
      setError(`No se pudieron cargar las cuentas: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function codigoMoneda(monedaId: number): string {
    return monedas.find((m) => m.id === monedaId)?.codigo ?? "—";
  }

  function terminarEdicion() {
    setCuentaEnEdicion(null);
    cargar();
  }

  async function alternarEstado(cuenta: Cuenta) {
    const nuevo: EstadoCuenta = cuenta.estado === "Activa" ? "Archivada" : "Activa";
    await cambiarEstadoCuenta(cuenta.id, nuevo);
    cargar();
  }

  async function borrar(cuenta: Cuenta) {
    await eliminarCuenta(cuenta.id);
    if (cuentaEnEdicion?.id === cuenta.id) setCuentaEnEdicion(null);
    cargar();
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Cuentas</h2>
        <p>
          Las cuentas donde vive tu dinero. El saldo de cada una será siempre la
          suma de sus movimientos.
        </p>
      </header>

      <FormularioCuenta
        key={cuentaEnEdicion ? `editar-${cuentaEnEdicion.id}` : "nueva"}
        monedas={monedas}
        cuentaAEditar={cuentaEnEdicion}
        onGuardada={terminarEdicion}
        onCancelar={() => setCuentaEnEdicion(null)}
      />

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : cuentas.length === 0 ? (
        <p className="vacio">Todavía no hay cuentas. Creá la primera arriba.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Moneda</th>
              <th>Estado</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((cuenta) => (
              <tr
                key={cuenta.id}
                className={cuenta.estado === "Archivada" ? "fila-tenue" : ""}
              >
                <td>{cuenta.nombre}</td>
                <td>{ETIQUETA_TIPO[cuenta.tipo]}</td>
                <td>{codigoMoneda(cuenta.monedaId)}</td>
                <td>
                  <span
                    className={
                      cuenta.estado === "Archivada"
                        ? "insignia tenue"
                        : "insignia"
                    }
                  >
                    {cuenta.estado}
                  </span>
                </td>
                <td>
                  <div className="acciones">
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => setCuentaEnEdicion(cuenta)}
                    >
                      Editar
                    </button>
                    {cuenta.enUso ? (
                      <button
                        type="button"
                        className="boton-tenue"
                        onClick={() => alternarEstado(cuenta)}
                      >
                        {cuenta.estado === "Activa" ? "Archivar" : "Activar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="boton-tenue"
                        onClick={() => borrar(cuenta)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
