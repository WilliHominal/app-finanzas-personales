import { useState, type FormEvent } from "react";
import type { Moneda } from "../../shared/monedas";
import { actualizarCuenta, crearCuenta } from "./cuentas.repositorio";
import {
  ETIQUETA_TIPO,
  TIPOS_CUENTA,
  type Cuenta,
  type TipoCuenta,
} from "./cuentas.tipos";

interface Props {
  monedas: Moneda[];
  cuentaAEditar: Cuenta | null;
  onGuardada: () => void;
  onCancelar: () => void;
}

export function FormularioCuenta({
  monedas,
  cuentaAEditar,
  onGuardada,
  onCancelar,
}: Props) {
  const editando = cuentaAEditar !== null;
  const [nombre, setNombre] = useState(cuentaAEditar?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoCuenta>(cuentaAEditar?.tipo ?? "Efectivo");
  const [monedaId, setMonedaId] = useState(
    cuentaAEditar ? String(cuentaAEditar.monedaId) : "",
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) {
      setError("Poné un nombre para la cuenta.");
      return;
    }
    if (!monedaId) {
      setError("Elegí una moneda.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      const datos = { nombre: nombre.trim(), tipo, monedaId: Number(monedaId) };
      if (cuentaAEditar) {
        await actualizarCuenta(cuentaAEditar.id, datos);
      } else {
        await crearCuenta(datos);
        setNombre("");
        setTipo("Efectivo");
        setMonedaId("");
      }
      onGuardada();
    } catch (e) {
      setError(`No se pudo guardar la cuenta: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo campo-ancho">
        <label htmlFor="cuenta-nombre">Nombre</label>
        <input
          id="cuenta-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Efectivo, Banco Galicia…"
        />
      </div>
      <div className="campo">
        <label htmlFor="cuenta-tipo">Tipo</label>
        <select
          id="cuenta-tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoCuenta)}
        >
          {TIPOS_CUENTA.map((t) => (
            <option key={t} value={t}>
              {ETIQUETA_TIPO[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="cuenta-moneda">Moneda</label>
        <select
          id="cuenta-moneda"
          value={monedaId}
          onChange={(e) => setMonedaId(e.target.value)}
        >
          <option value="">Elegí…</option>
          {monedas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.codigo}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear cuenta"}
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
