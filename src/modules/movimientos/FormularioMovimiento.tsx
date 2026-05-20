import { useState, type FormEvent } from "react";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import type { Categoria } from "../parametros/categorias.tipos";
import { crearMovimiento } from "./movimientos.repositorio";
import { TIPOS_ALTA, type NuevoMovimiento } from "./movimientos.tipos";

type TipoAlta = (typeof TIPOS_ALTA)[number];

interface Props {
  cuentas: Cuenta[];
  categorias: Categoria[];
  onMovimientoCreado: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormularioMovimiento({
  cuentas,
  categorias,
  onMovimientoCreado,
}: Props) {
  const [tipo, setTipo] = useState<TipoAlta>("Gasto");
  const [fecha, setFecha] = useState(hoy());
  const [cuentaId, setCuentaId] = useState("");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const usaCategoria = tipo !== "Apertura";
  const categoriasDelTipo = categorias.filter((c) => c.tipo === tipo);

  function cambiarTipo(nuevoTipo: TipoAlta) {
    setTipo(nuevoTipo);
    setCategoriaId("");
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();

    if (!cuentaId) {
      setError("Elegí una cuenta.");
      return;
    }
    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError("El monto tiene que ser un número mayor a cero.");
      return;
    }
    if (usaCategoria && !categoriaId) {
      setError("Elegí una categoría.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const esEgreso = tipo === "Gasto";
      const montoTexto = montoNumero.toFixed(2);
      const descripcionFinal =
        descripcion.trim() || (tipo === "Apertura" ? "Saldo inicial" : "");

      const nuevo: NuevoMovimiento = {
        fecha,
        descripcion: descripcionFinal,
        tipo,
        cuentaOrigenId: esEgreso ? Number(cuentaId) : null,
        cuentaDestinoId: esEgreso ? null : Number(cuentaId),
        montoOrigen: esEgreso ? montoTexto : null,
        montoDestino: esEgreso ? null : montoTexto,
        categoriaId: usaCategoria ? Number(categoriaId) : null,
      };
      await crearMovimiento(nuevo);
      setMonto("");
      setDescripcion("");
      setCategoriaId("");
      onMovimientoCreado();
    } catch (e) {
      setError(`No se pudo registrar el movimiento: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo">
        <label htmlFor="mov-tipo">Tipo</label>
        <select
          id="mov-tipo"
          value={tipo}
          onChange={(e) => cambiarTipo(e.target.value as TipoAlta)}
        >
          {TIPOS_ALTA.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="mov-fecha">Fecha</label>
        <input
          id="mov-fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <div className="campo">
        <label htmlFor="mov-cuenta">Cuenta</label>
        <select
          id="mov-cuenta"
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
        <label htmlFor="mov-monto">Monto</label>
        <input
          id="mov-monto"
          type="number"
          step="0.01"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0,00"
        />
      </div>
      {usaCategoria && (
        <div className="campo">
          <label htmlFor="mov-categoria">Categoría</label>
          <select
            id="mov-categoria"
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
      )}
      <div className="campo campo-ancho">
        <label htmlFor="mov-descripcion">Descripción</label>
        <input
          id="mov-descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Registrar"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
