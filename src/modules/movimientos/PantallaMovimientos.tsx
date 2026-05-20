import { useCallback, useEffect, useMemo, useState } from "react";
import { formatearMonto } from "../../shared/formato";
import { listarMonedas, type Moneda } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { listarCategorias } from "../parametros/categorias.repositorio";
import type { Categoria } from "../parametros/categorias.tipos";
import { FormularioMovimiento } from "./FormularioMovimiento";
import { eliminarMovimiento, listarMovimientos } from "./movimientos.repositorio";
import type { Movimiento } from "./movimientos.tipos";

export function PantallaMovimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [movs, ctas, cats, mons] = await Promise.all([
        listarMovimientos(),
        listarCuentas(),
        listarCategorias(),
        listarMonedas(),
      ]);
      setMovimientos(movs);
      setCuentas(ctas);
      setCategorias(cats);
      setMonedas(mons);
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

  function codigoMonedaDeCuenta(id: number | null): string {
    const cuenta = id === null ? undefined : cuentas.find((c) => c.id === id);
    if (!cuenta) return "";
    return monedas.find((m) => m.id === cuenta.monedaId)?.codigo ?? "";
  }

  async function borrar(movimiento: Movimiento) {
    await eliminarMovimiento(movimiento.id);
    cargar();
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Movimientos</h2>
        <p>La bitácora de tu dinero. Cada movimiento es un hecho registrado.</p>
      </header>

      {cuentasActivas.length === 0 ? (
        <p className="vacio">
          Primero creá una cuenta en la sección Cuentas para poder registrar
          movimientos.
        </p>
      ) : (
        <FormularioMovimiento
          cuentas={cuentasActivas}
          categorias={categoriasActivas}
          onMovimientoCreado={cargar}
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
            {movimientos.map((mov) => {
              const esGasto = mov.tipo === "Gasto";
              const cuentaId = esGasto ? mov.cuentaOrigenId : mov.cuentaDestinoId;
              const monto = esGasto ? mov.montoOrigen : mov.montoDestino;
              const claseMonto =
                mov.tipo === "Ingreso"
                  ? "monto ingreso"
                  : esGasto
                    ? "monto gasto"
                    : "monto";
              return (
                <tr key={mov.id}>
                  <td>{mov.fecha}</td>
                  <td>{mov.tipo}</td>
                  <td>{nombreCuenta(cuentaId)}</td>
                  <td>{nombreCategoria(mov.categoriaId)}</td>
                  <td>{mov.descripcion || "—"}</td>
                  <td className={claseMonto}>
                    {esGasto ? "−" : ""}
                    {formatearMonto(monto)} {codigoMonedaDeCuenta(cuentaId)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => borrar(mov)}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
