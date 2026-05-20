import { useCallback, useEffect, useState } from "react";
import {
  cambiarEstadoCategoria,
  eliminarCategoria,
  listarCategorias,
} from "./categorias.repositorio";
import type { Categoria } from "./categorias.tipos";
import { FormularioCategoria } from "./FormularioCategoria";

export function PantallaCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      setCategorias(await listarCategorias());
    } catch (e) {
      setError(`No se pudieron cargar las categorías: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function alternarEstado(categoria: Categoria) {
    await cambiarEstadoCategoria(categoria.id, !categoria.activa);
    cargar();
  }

  async function borrar(categoria: Categoria) {
    await eliminarCategoria(categoria.id);
    cargar();
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Categorías</h2>
        <p>
          El catálogo con el que clasificás tus ingresos y gastos. Una categoría
          sin movimientos se puede eliminar; si ya tiene uso, se desactiva.
        </p>
      </header>

      <FormularioCategoria onCategoriaCreada={cargar} />

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : categorias.length === 0 ? (
        <p className="vacio">Todavía no hay categorías. Creá la primera arriba.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Color</th>
              <th>Estado</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => (
              <tr
                key={categoria.id}
                className={categoria.activa ? "" : "fila-tenue"}
              >
                <td>{categoria.nombre}</td>
                <td>{categoria.tipo}</td>
                <td>
                  {categoria.color ? (
                    <span
                      className="color-muestra"
                      style={{ background: categoria.color }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span
                    className={categoria.activa ? "insignia" : "insignia tenue"}
                  >
                    {categoria.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td>
                  {categoria.enUso ? (
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => alternarEstado(categoria)}
                    >
                      {categoria.activa ? "Desactivar" : "Activar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="boton-tenue"
                      onClick={() => borrar(categoria)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
