import { useState, type FormEvent } from "react";
import type { Moneda } from "../../shared/monedas";
import { crearCuenta } from "./cuentas.repositorio";
import { ETIQUETA_TIPO, TIPOS_CUENTA, type TipoCuenta } from "./cuentas.tipos";

interface Props {
  monedas: Moneda[];
  onCuentaCreada: () => void;
}

export function FormularioCuenta({ monedas, onCuentaCreada }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoCuenta>("Efectivo");
  const [monedaId, setMonedaId] = useState("");
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
      await crearCuenta({ nombre: nombre.trim(), tipo, monedaId: Number(monedaId) });
      setNombre("");
      setTipo("Efectivo");
      setMonedaId("");
      onCuentaCreada();
    } catch (e) {
      setError(`No se pudo crear la cuenta: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario-cuenta" onSubmit={manejarEnvio}>
      <div className="campo campo-nombre">
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
        {guardando ? "Guardando…" : "Crear cuenta"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
