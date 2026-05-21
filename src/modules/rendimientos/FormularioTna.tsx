import { useState, type FormEvent } from "react";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { crearTramo } from "./rendimientos.repositorio";

interface Props {
  cuentas: Cuenta[];
  onGuardado: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormularioTna({ cuentas, onGuardado }: Props) {
  const [cuentaId, setCuentaId] = useState("");
  const [vigenciaDesde, setVigenciaDesde] = useState(hoy());
  const [tna, setTna] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!cuentaId) {
      setError("Elegí una cuenta remunerada.");
      return;
    }
    const tnaNumero = Number(tna);
    if (!Number.isFinite(tnaNumero) || tnaNumero <= 0) {
      setError("La TNA tiene que ser un número mayor a cero.");
      return;
    }
    if (!vigenciaDesde) {
      setError("Indicá desde cuándo rige la tasa.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      await crearTramo({
        cuentaId: Number(cuentaId),
        vigenciaDesde,
        tna: tna.trim(),
      });
      setTna("");
      onGuardado();
    } catch (e) {
      setError(`No se pudo guardar la tasa: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo">
        <label htmlFor="tna-cuenta">Cuenta remunerada</label>
        <select
          id="tna-cuenta"
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
        >
          <option value="">Elegí…</option>
          {cuentas.map((cuenta) => (
            <option key={cuenta.id} value={cuenta.id}>
              {cuenta.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="tna-valor">TNA (% anual)</label>
        <input
          id="tna-valor"
          type="number"
          step="0.01"
          min="0"
          value={tna}
          onChange={(e) => setTna(e.target.value)}
          placeholder="27"
        />
      </div>
      <div className="campo">
        <label htmlFor="tna-desde">Vigente desde</label>
        <input
          id="tna-desde"
          type="date"
          value={vigenciaDesde}
          onChange={(e) => setVigenciaDesde(e.target.value)}
        />
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Cargar tasa"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
