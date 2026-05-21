import { useState, type FormEvent } from "react";
import type { Moneda } from "../../shared/monedas";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import { crearPrestamo } from "./prestamos.servicio";
import type { TipoPrestamo } from "./prestamos.tipos";

interface Props {
  cuentas: Cuenta[];
  monedas: Moneda[];
  onGuardado: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormularioPrestamo({ cuentas, monedas, onGuardado }: Props) {
  const [tipo, setTipo] = useState<TipoPrestamo>("Otorgado");
  const [preexistente, setPreexistente] = useState(false);
  const [contraparte, setContraparte] = useState("");
  const [monedaId, setMonedaId] = useState("");
  const [capital, setCapital] = useState("");
  const [cuentaPropiaId, setCuentaPropiaId] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cuentasDeMoneda = cuentas.filter(
    (cuenta) =>
      cuenta.estado === "Activa" &&
      String(cuenta.monedaId) === monedaId &&
      !cuenta.tipo.startsWith("Prestamo"),
  );

  function cambiarMoneda(nuevaMoneda: string) {
    setMonedaId(nuevaMoneda);
    setCuentaPropiaId("");
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!contraparte.trim()) {
      setError("Indicá con quién es el préstamo.");
      return;
    }
    if (!monedaId) {
      setError("Elegí la moneda del préstamo.");
      return;
    }
    const capitalNumero = Number(capital);
    if (!Number.isFinite(capitalNumero) || capitalNumero <= 0) {
      setError(
        preexistente
          ? "El saldo pendiente tiene que ser un número mayor a cero."
          : "El capital tiene que ser un número mayor a cero.",
      );
      return;
    }
    if (!preexistente && !cuentaPropiaId) {
      setError(
        tipo === "Otorgado"
          ? "Elegí de qué cuenta sale la plata."
          : "Elegí en qué cuenta entra la plata.",
      );
      return;
    }
    if (!fecha) {
      setError("Indicá la fecha del préstamo.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      await crearPrestamo({
        tipo,
        contraparte: contraparte.trim(),
        capital: capitalNumero.toFixed(2),
        fecha,
        notas: notas.trim() || null,
        monedaId: Number(monedaId),
        preexistente,
        cuentaPropiaId: preexistente ? null : Number(cuentaPropiaId),
      });
      setContraparte("");
      setCapital("");
      setCuentaPropiaId("");
      setNotas("");
      onGuardado();
    } catch (e) {
      setError(`No se pudo registrar el préstamo: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo">
        <label htmlFor="prestamo-tipo">Tipo</label>
        <select
          id="prestamo-tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoPrestamo)}
        >
          <option value="Otorgado">Otorgado</option>
          <option value="Recibido">Recibido</option>
        </select>
      </div>
      <div className="campo">
        <label htmlFor="prestamo-registro">Registro</label>
        <select
          id="prestamo-registro"
          value={preexistente ? "Preexistente" : "Nuevo"}
          onChange={(e) => setPreexistente(e.target.value === "Preexistente")}
        >
          <option value="Nuevo">Nuevo</option>
          <option value="Preexistente">Preexistente</option>
        </select>
      </div>
      <div className="campo campo-ancho">
        <label htmlFor="prestamo-contraparte">Contraparte</label>
        <input
          id="prestamo-contraparte"
          value={contraparte}
          onChange={(e) => setContraparte(e.target.value)}
          placeholder="Ej: Juan, Banco Galicia…"
        />
      </div>
      <div className="campo">
        <label htmlFor="prestamo-moneda">Moneda</label>
        <select
          id="prestamo-moneda"
          value={monedaId}
          onChange={(e) => cambiarMoneda(e.target.value)}
        >
          <option value="">Elegí…</option>
          {monedas.map((moneda) => (
            <option key={moneda.id} value={moneda.id}>
              {moneda.codigo}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="prestamo-capital">
          {preexistente ? "Saldo pendiente" : "Capital"}
        </label>
        <input
          id="prestamo-capital"
          type="number"
          step="0.01"
          min="0"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          placeholder="0,00"
        />
      </div>
      {!preexistente && (
        <div className="campo">
          <label htmlFor="prestamo-cuenta">
            {tipo === "Otorgado" ? "Sale de la cuenta" : "Entra a la cuenta"}
          </label>
          <select
            id="prestamo-cuenta"
            value={cuentaPropiaId}
            onChange={(e) => setCuentaPropiaId(e.target.value)}
          >
            <option value="">
              {monedaId ? "Elegí…" : "Elegí la moneda primero"}
            </option>
            {cuentasDeMoneda.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="campo">
        <label htmlFor="prestamo-fecha">Fecha</label>
        <input
          id="prestamo-fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <div className="campo campo-ancho">
        <label htmlFor="prestamo-notas">Notas</label>
        <input
          id="prestamo-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Registrar préstamo"}
      </button>
      {preexistente && (
        <p className="nota">
          Un préstamo preexistente se registra como saldo inicial: no mueve
          ninguna otra cuenta.
        </p>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
