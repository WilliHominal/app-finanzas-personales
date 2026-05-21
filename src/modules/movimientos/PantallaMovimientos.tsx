import { useCallback, useEffect, useMemo, useState } from "react";
import { formatearMonto } from "../../shared/formato";
import { listarMonedas, type Moneda } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { listarCategorias } from "../parametros/categorias.repositorio";
import type { Categoria } from "../parametros/categorias.tipos";
import {
  calcularPendientes,
  confirmarPendiente,
  type Pendiente,
} from "../recurrencia/recurrencia.servicio";
import { FormularioMovimiento } from "./FormularioMovimiento";
import { eliminarMovimiento, listarMovimientos } from "./movimientos.repositorio";
import type { Movimiento } from "./movimientos.tipos";

export function PantallaMovimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [enEdicion, setEnEdicion] = useState<Movimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [movs, ctas, cats, mons, pend] = await Promise.all([
        listarMovimientos(),
        listarCuentas(),
        listarCategorias(),
        listarMonedas(),
        calcularPendientes(),
      ]);
      setMovimientos(movs);
      setCuentas(ctas);
      setCategorias(cats);
      setMonedas(mons);
      setPendientes(pend);
    } catch (e) {
      setError(`No se pudieron cargar los movimientos: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cuentasActivas = useMemo(
    () => cuentas.filter((c) => c.estado === "Activa"),
    [cuentas],
  );
  const categoriasActivas = useMemo(
    () => categorias.filter((c) => c.activa),
    [categorias],
  );

  function nombreCuenta(id: number | null): string {
    if (id === null) return "—";
    return cuentas.find((c) => c.id === id)?.nombre ?? "—";
  }

  function nombreCategoria(id: number | null): string {
    if (id === null) return "—";
    return categorias.find((c) => c.id === id)?.nombre ?? "—";
  }

  function codigoMoneda(cuentaId: number | null): string {
    const cuenta =
      cuentaId === null ? undefined : cuentas.find((c) => c.id === cuentaId);
    if (!cuenta) return "";
    return monedas.find((m) => m.id === cuenta.monedaId)?.codigo ?? "";
  }

  function terminarEdicion() {
    setEnEdicion(null);
    cargar();
  }

  async function borrar(movimiento: Movimiento) {
    await eliminarMovimiento(movimiento.id);
    if (enEdicion?.id === movimiento.id) setEnEdicion(null);
    cargar();
  }

  async function confirmar(pendiente: Pendiente) {
    await confirmarPendiente(pendiente);
    cargar();
  }

  function celdaCuenta(mov: Movimiento) {
    if (mov.tipo === "Transferencia") {
      return `${nombreCuenta(mov.cuentaOrigenId)} → ${nombreCuenta(mov.cuentaDestinoId)}`;
    }
    const id = mov.tipo === "Gasto" ? mov.cuentaOrigenId : mov.cuentaDestinoId;
    return nombreCuenta(id);
  }

  function celdaMonto(mov: Movimiento) {
    if (mov.tipo === "Transferencia") {
      const codO = codigoMoneda(mov.cuentaOrigenId);
      const codD = codigoMoneda(mov.cuentaDestinoId);
      const salida = `${formatearMonto(mov.montoOrigen)} ${codO}`;
      if (codO !== codD) {
        return `${salida} → ${formatearMonto(mov.montoDestino)} ${codD}`;
      }
      return salida;
    }
    const esGasto = mov.tipo === "Gasto";
    const monto = esGasto ? mov.montoOrigen : mov.montoDestino;
    const cuentaId = esGasto ? mov.cuentaOrigenId : mov.cuentaDestinoId;
    return `${esGasto ? "−" : ""}${formatearMonto(monto)} ${codigoMoneda(cuentaId)}`;
  }

  function claseMonto(mov: Movimiento): string {
    if (mov.tipo === "Ingreso") return "monto ingreso";
    if (mov.tipo === "Gasto") return "monto gasto";
    return "monto";
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Movimientos</h2>
        <p>La bitácora de tu dinero. Cada movimiento es un hecho registrado.</p>
      </header>

      {pendientes.length > 0 && (
        <table className="tabla tabla-pendientes">
          <thead>
            <tr>
              <th>Pendiente de confirmar</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cuenta</th>
              <th className="monto">Monto</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map((pendiente) => (
              <tr key={`${pendiente.regla.id}-${pendiente.fecha}`}>
                <td>{pendiente.regla.descripcion}</td>
                <td>{pendiente.fecha}</td>
                <td>{pendiente.regla.tipo}</td>
                <td>{nombreCuenta(pendiente.regla.cuentaId)}</td>
                <td
                  className={
                    pendiente.regla.tipo === "Ingreso"
                      ? "monto ingreso"
                      : "monto gasto"
                  }
                >
                  {formatearMonto(pendiente.regla.monto)}
                </td>
                <td>
                  <button
                    type="button"
                    className="boton-primario"
                    onClick={() => confirmar(pendiente)}
                  >
                    Confirmar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {cuentasActivas.length === 0 ? (
        <p className="vacio">
          Primero creá una cuenta en la sección Cuentas para poder registrar
          movimientos.
        </p>
      ) : (
        <FormularioMovimiento
          key={enEdicion ? `editar-${enEdicion.id}` : "nuevo"}
          cuentas={cuentasActivas}
          monedas={monedas}
          categorias={categoriasActivas}
          movimientoAEditar={enEdicion}
          onGuardado={terminarEdicion}
          onCancelar={() => setEnEdicion(null)}
        />
      )}

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : movimientos.length === 0 ? (
        <p className="vacio">Todavía no hay movimientos registrados.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cuenta</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th className="monto">Monto</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr
                key={mov.id}
                className={enEdicion?.id === mov.id ? "fila-tenue" : ""}
              >
                <td>{mov.fecha}</td>
                <td>{mov.tipo}</td>
                <td>{celdaCuenta(mov)}</td>
                <td>{nombreCategoria(mov.categoriaId)}</td>
                <td>{mov.descripcion || "—"}</td>
                <td className={claseMonto(mov)}>{celdaMonto(mov)}</td>
                <td>
                  <div className="acciones">
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => setEnEdicion(mov)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => borrar(mov)}
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
