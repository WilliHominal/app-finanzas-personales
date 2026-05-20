import { useState, type FormEvent } from "react";
import { crearCategoria } from "./categorias.repositorio";
import { TIPOS_CATEGORIA, type TipoCategoria } from "./categorias.tipos";

interface Props {
  onCategoriaCreada: () => void;
}

export function FormularioCategoria({ onCategoriaCreada }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoCategoria>("Gasto");
  const [color, setColor] = useState("#0d7a5f");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) {
      setError("Poné un nombre para la categoría.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      await crearCategoria({ nombre: nombre.trim(), tipo, color });
      setNombre("");
      setTipo("Gasto");
      onCategoriaCreada();
    } catch (e) {
      setError(`No se pudo crear la categoría: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo campo-ancho">
        <label htmlFor="categoria-nombre">Nombre</label>
        <input
          id="categoria-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Sueldo, Supermercado…"
        />
      </div>
      <div className="campo">
        <label htmlFor="categoria-tipo">Tipo</label>
        <select
          id="categoria-tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoCategoria)}
        >
          {TIPOS_CATEGORIA.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="categoria-color">Color</label>
        <input
          id="categoria-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Crear categoría"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
