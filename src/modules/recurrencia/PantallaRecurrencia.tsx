import { useCallback, useEffect, useMemo, useState } from "react";
import { formatearMonto } from "../../shared/formato";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { listarCategorias } from "../parametros/categorias.repositorio";
import type { Categoria } from "../parametros/categorias.tipos";
import { FormularioRegla } from "./FormularioRegla";
import {
  cambiarEstadoRegla,
  eliminarRegla,
  listarReglas,
} from "./recurrencia.repositorio";
import { ETIQUETA_MODO, MESES, type ReglaRecurrente } from "./recurrencia.tipos";

/** Describe cuándo se aplica una regla según su frecuencia. */
function cuando(regla: ReglaRecurrente): string {
  if (regla.frecuencia === "Anual" && regla.mesAplicacion !== null) {
    const mes = MESES[regla.mesAplicacion - 1].toLowerCase();
    return `${regla.diaAplicacion} de ${mes}`;
  }
  return `Día ${regla.diaAplicacion}`;
}

export function PantallaRecurrencia() {
  const [reglas, setReglas] = useState<ReglaRecurrente[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [enEdicion, setEnEdicion] = useState<ReglaRecurrente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [listaReglas, listaCuentas, listaCategorias] = await Promise.all([
        listarReglas(),
        listarCuentas(),
        listarCategorias(),
      ]);
      setReglas(listaReglas);
      setCuentas(listaCuentas);
      setCategorias(listaCategorias);
    } catch (e) {
      setError(`No se pudieron cargar las reglas: ${e}`);
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

  function nombreCuenta(id: number): string {
    return cuentas.find((c) => c.id === id)?.nombre ?? "—";
  }

  function nombreCategoria(id: number | null): string {
    if (id === null) return "—";
    return categorias.find((c) => c.id === id)?.nombre ?? "—";
  }

  function terminarEdicion() {
    setEnEdicion(null);
    cargar();
  }

  async function alternarEstado(regla: ReglaRecurrente) {
    await cambiarEstadoRegla(regla.id, !regla.activa);
    cargar();
  }

  async function borrar(regla: ReglaRecurrente) {
    await eliminarRegla(regla.id);
    if (enEdicion?.id === regla.id) setEnEdicion(null);
    cargar();
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Reglas Recurrentes</h2>
        <p>
          Lo que se repite cada tanto: suscripciones, sueldos, pagos anuales.
          Cada regla es una plantilla; al llegar su fecha genera un movimiento
          real.
        </p>
      </header>

      {cuentasActivas.length === 0 ? (
        <p className="vacio">
          Primero creá una cuenta en la sección Cuentas para poder definir
          reglas.
        </p>
      ) : (
        <FormularioRegla
          key={enEdicion ? `editar-${enEdicion.id}` : "nueva"}
          cuentas={cuentasActivas}
          categorias={categoriasActivas}
          reglaAEditar={enEdicion}
          onGuardada={terminarEdicion}
          onCancelar={() => setEnEdicion(null)}
        />
      )}

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : reglas.length === 0 ? (
        <p className="vacio">Todavía no hay reglas recurrentes.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Cuenta</th>
              <th>Categoría</th>
              <th className="monto">Monto</th>
              <th>Cuándo</th>
              <th>Modo</th>
              <th>Estado</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {reglas.map((regla) => (
              <tr
                key={regla.id}
                className={regla.activa ? "" : "fila-tenue"}
              >
                <td>{regla.descripcion}</td>
                <td>{regla.tipo}</td>
                <td>{nombreCuenta(regla.cuentaId)}</td>
                <td>{nombreCategoria(regla.categoriaId)}</td>
                <td
                  className={
                    regla.tipo === "Ingreso" ? "monto ingreso" : "monto gasto"
                  }
                >
                  {formatearMonto(regla.monto)}
                </td>
                <td>{cuando(regla)}</td>
                <td>{ETIQUETA_MODO[regla.modo]}</td>
                <td>
                  <span
                    className={regla.activa ? "insignia" : "insignia tenue"}
                  >
                    {regla.activa ? "Activa" : "Pausada"}
                  </span>
                </td>
                <td>
                  <div className="acciones">
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => setEnEdicion(regla)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => alternarEstado(regla)}
                    >
                      {regla.activa ? "Pausar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => borrar(regla)}
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
