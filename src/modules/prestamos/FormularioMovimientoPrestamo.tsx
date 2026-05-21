import { useState, type FormEvent } from "react";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import {
  registrarMovimientoPrestamo,
  type AccionPrestamo,
} from "./prestamos.servicio";
import type { Prestamo } from "./prestamos.tipos";

interface Props {
  prestamo: Prestamo;
  accion: AccionPrestamo;
  cuentas: Cuenta[];
  onGuardado: () => void;
  onCancelar: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function tituloDe(prestamo: Prestamo, accion: AccionPrestamo): string {
  if (accion === "ampliacion") {
    return `Ampliar préstamo · ${prestamo.contraparte}`;
  }
  return prestamo.tipo === "Otorgado"
    ? `Registrar cobro · ${prestamo.contraparte}`
    : `Registrar pago · ${prestamo.contraparte}`;
}

export function FormularioMovimientoPrestamo({
  prestamo,
  accion,
  cuentas,
  onGuardado,
  onCancelar,
}: Props) {
  const [monto, setMonto] = useState("");
  const [cuentaPropiaId, setCuentaPropiaId] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const monedaPrestamo = cuentas.find(
    (cuenta) => cuenta.id === prestamo.cuentaId,
  )?.monedaId;
  const cuentasPropias = cuentas.filter(
    (cuenta) =>
      cuenta.estado === "Activa" &&
      cuenta.monedaId === monedaPrestamo &&
      !cuenta.tipo.startsWith("Prestamo"),
  );

  const laPlataEntra = (prestamo.tipo === "Otorgado") === (accion === "pago");

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError("El monto tiene que ser un número mayor a cero.");
      return;
    }
    if (!cuentaPropiaId) {
      setError("Elegí la cuenta.");
      return;
    }
    if (!fecha) {
      setError("Indicá la fecha.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      await registrarMovimientoPrestamo(
        prestamo,
        accion,
        montoNumero.toFixed(2),
        Number(cuentaPropiaId),
        fecha,
      );
      onGuardado();
    } catch (e) {
      setError(`No se pudo registrar el movimiento: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <p className="formulario-titulo">{tituloDe(prestamo, accion)}</p>
      <div className="campo">
        <label htmlFor="mov-prestamo-monto">Monto</label>
        <input
          id="mov-prestamo-monto"
          type="number"
          step="0.01"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0,00"
        />
      </div>
      <div className="campo">
        <label htmlFor="mov-prestamo-cuenta">
          {laPlataEntra ? "Entra a la cuenta" : "Sale de la cuenta"}
        </label>
        <select
          id="mov-prestamo-cuenta"
          value={cuentaPropiaId}
          onChange={(e) => setCuentaPropiaId(e.target.value)}
        >
          <option value="">Elegí…</option>
          {cuentasPropias.map((cuenta) => (
            <option key={cuenta.id} value={cuenta.id}>
              {cuenta.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="mov-prestamo-fecha">Fecha</label>
        <input
          id="mov-prestamo-fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Registrar"}
      </button>
      <button type="button" className="boton-tenue" onClick={onCancelar}>
        Cancelar
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
