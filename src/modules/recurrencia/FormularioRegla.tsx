import { useState, type FormEvent } from "react";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import type { Categoria } from "../parametros/categorias.tipos";
import { actualizarRegla, crearRegla } from "./recurrencia.repositorio";
import type {
  ModoRegla,
  NuevaRegla,
  ReglaRecurrente,
  TipoRegla,
} from "./recurrencia.tipos";

interface Props {
  cuentas: Cuenta[];
  categorias: Categoria[];
  reglaAEditar: ReglaRecurrente | null;
  onGuardada: () => void;
  onCancelar: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormularioRegla({
  cuentas,
  categorias,
  reglaAEditar,
  onGuardada,
  onCancelar,
}: Props) {
  const editando = reglaAEditar !== null;
  const [tipo, setTipo] = useState<TipoRegla>(reglaAEditar?.tipo ?? "Gasto");
  const [descripcion, setDescripcion] = useState(reglaAEditar?.descripcion ?? "");
  const [monto, setMonto] = useState(reglaAEditar?.monto ?? "");
  const [cuentaId, setCuentaId] = useState(
    reglaAEditar ? String(reglaAEditar.cuentaId) : "",
  );
  const [categoriaId, setCategoriaId] = useState(
    reglaAEditar?.categoriaId != null ? String(reglaAEditar.categoriaId) : "",
  );
  const [diaAplicacion, setDiaAplicacion] = useState(
    reglaAEditar ? String(reglaAEditar.diaAplicacion) : "1",
  );
  const [vigenciaDesde, setVigenciaDesde] = useState(
    reglaAEditar?.vigenciaDesde ?? hoy(),
  );
  const [vigenciaHasta, setVigenciaHasta] = useState(
    reglaAEditar?.vigenciaHasta ?? "",
  );
  const [modo, setModo] = useState<ModoRegla>(reglaAEditar?.modo ?? "Confirmar");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const categoriasDelTipo = categorias.filter((c) => c.tipo === tipo);

  function cambiarTipo(nuevoTipo: TipoRegla) {
    setTipo(nuevoTipo);
    setCategoriaId("");
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!descripcion.trim()) {
      setError("Poné una descripción para la regla.");
      return;
    }
    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError("El monto tiene que ser un número mayor a cero.");
      return;
    }
    if (!cuentaId) {
      setError("Elegí una cuenta.");
      return;
    }
    if (!categoriaId) {
      setError("Elegí una categoría.");
      return;
    }
    const dia = Number(diaAplicacion);
    if (!Number.isInteger(dia) || dia < 1 || dia > 28) {
      setError("El día del mes debe estar entre 1 y 28.");
      return;
    }
    if (!vigenciaDesde) {
      setError("Indicá desde cuándo rige la regla.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const datos: NuevaRegla = {
        tipo,
        descripcion: descripcion.trim(),
        monto: montoNumero.toFixed(2),
        cuentaId: Number(cuentaId),
        categoriaId: Number(categoriaId),
        diaAplicacion: dia,
        vigenciaDesde,
        vigenciaHasta: vigenciaHasta || null,
        modo,
      };
      if (reglaAEditar) {
        await actualizarRegla(reglaAEditar.id, datos);
      } else {
        await crearRegla(datos);
        setDescripcion("");
        setMonto("");
        setCategoriaId("");
      }
      onGuardada();
    } catch (e) {
      setError(`No se pudo guardar la regla: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo">
        <label htmlFor="regla-tipo">Tipo</label>
        <select
          id="regla-tipo"
          value={tipo}
          onChange={(e) => cambiarTipo(e.target.value as TipoRegla)}
        >
          <option value="Ingreso">Ingreso</option>
          <option value="Gasto">Gasto</option>
        </select>
      </div>
      <div className="campo campo-ancho">
        <label htmlFor="regla-descripcion">Descripción</label>
        <input
          id="regla-descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Sueldo Airtm, Netflix…"
        />
      </div>
      <div className="campo">
        <label htmlFor="regla-monto">Monto</label>
        <input
          id="regla-monto"
          type="number"
          step="0.01"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0,00"
        />
      </div>
      <div className="campo">
        <label htmlFor="regla-cuenta">Cuenta</label>
        <select
          id="regla-cuenta"
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
        >
          <option value="">Elegí…</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="regla-categoria">Categoría</label>
        <select
          id="regla-categoria"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="">Elegí…</option>
          {categoriasDelTipo.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="regla-dia">Día del mes</label>
        <input
          id="regla-dia"
          type="number"
          min="1"
          max="28"
          value={diaAplicacion}
          onChange={(e) => setDiaAplicacion(e.target.value)}
        />
      </div>
      <div className="campo">
        <label htmlFor="regla-desde">Vigente desde</label>
        <input
          id="regla-desde"
          type="date"
          value={vigenciaDesde}
          onChange={(e) => setVigenciaDesde(e.target.value)}
        />
      </div>
      <div className="campo">
        <label htmlFor="regla-hasta">Vigente hasta</label>
        <input
          id="regla-hasta"
          type="date"
          value={vigenciaHasta}
          onChange={(e) => setVigenciaHasta(e.target.value)}
        />
      </div>
      <div className="campo">
        <label htmlFor="regla-modo">Modo</label>
        <select
          id="regla-modo"
          value={modo}
          onChange={(e) => setModo(e.target.value as ModoRegla)}
        >
          <option value="Confirmar">Confirmar</option>
          <option value="Automatico">Automático</option>
        </select>
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear regla"}
      </button>
      {editando && (
        <button type="button" className="boton-tenue" onClick={onCancelar}>
          Cancelar
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
