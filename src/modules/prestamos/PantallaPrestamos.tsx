import { useCallback, useEffect, useState } from "react";
import { formatearMonto } from "../../shared/formato";
import { listarMonedas, type Moneda } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { FormularioMovimientoPrestamo } from "./FormularioMovimientoPrestamo";
import { FormularioPrestamo } from "./FormularioPrestamo";
import { eliminarPrestamo } from "./prestamos.repositorio";
import {
  obtenerPrestamos,
  type AccionPrestamo,
  type PrestamoVista,
} from "./prestamos.servicio";
import { ETIQUETA_TIPO_PRESTAMO } from "./prestamos.tipos";

interface AccionActiva {
  prestamo: PrestamoVista;
  accion: AccionPrestamo;
}

/** Saldo pendiente de un préstamo, en positivo sin importar el tipo. */
function pendienteDe(prestamo: PrestamoVista): string {
  return Math.abs(Number(prestamo.saldo)).toFixed(2);
}

export function PantallaPrestamos() {
  const [prestamos, setPrestamos] = useState<PrestamoVista[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [accionActiva, setAccionActiva] = useState<AccionActiva | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [listaPrestamos, listaCuentas, listaMonedas] = await Promise.all([
        obtenerPrestamos(),
        listarCuentas(),
        listarMonedas(),
      ]);
      setPrestamos(listaPrestamos);
      setCuentas(listaCuentas);
      setMonedas(listaMonedas);
    } catch (e) {
      setError(`No se pudieron cargar los préstamos: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function terminarAccion() {
    setAccionActiva(null);
    cargar();
  }

  async function borrar(prestamo: PrestamoVista) {
    await eliminarPrestamo(prestamo.id, prestamo.cuentaId);
    if (accionActiva?.prestamo.id === prestamo.id) setAccionActiva(null);
    cargar();
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Préstamos</h2>
        <p>
          La plata que prestaste y la que te prestaron. Registrá cobros, pagos
          y ampliaciones desde acá: el saldo de cada préstamo se ajusta solo.
        </p>
      </header>

      {accionActiva ? (
        <FormularioMovimientoPrestamo
          key={`${accionActiva.prestamo.id}-${accionActiva.accion}`}
          prestamo={accionActiva.prestamo}
          accion={accionActiva.accion}
          cuentas={cuentas}
          onGuardado={terminarAccion}
          onCancelar={() => setAccionActiva(null)}
        />
      ) : (
        <FormularioPrestamo
          cuentas={cuentas}
          monedas={monedas}
          onGuardado={cargar}
        />
      )}

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : prestamos.length === 0 ? (
        <p className="vacio">Todavía no registraste préstamos.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Contraparte</th>
              <th>Tipo</th>
              <th className="monto">Capital</th>
              <th className="monto">Pendiente</th>
              <th>Fecha</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {prestamos.map((prestamo) => (
              <tr key={prestamo.id}>
                <td>{prestamo.contraparte}</td>
                <td>{ETIQUETA_TIPO_PRESTAMO[prestamo.tipo]}</td>
                <td className="monto">{formatearMonto(prestamo.capital)}</td>
                <td
                  className={
                    prestamo.tipo === "Otorgado"
                      ? "monto ingreso"
                      : "monto gasto"
                  }
                >
                  {formatearMonto(pendienteDe(prestamo))}
                </td>
                <td>{prestamo.fecha}</td>
                <td>
                  <div className="acciones">
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() =>
                        setAccionActiva({ prestamo, accion: "pago" })
                      }
                    >
                      {prestamo.tipo === "Otorgado"
                        ? "Registrar cobro"
                        : "Registrar pago"}
                    </button>
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() =>
                        setAccionActiva({ prestamo, accion: "ampliacion" })
                      }
                    >
                      Ampliar
                    </button>
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => borrar(prestamo)}
                    >
                      Borrar
                    </button>
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
