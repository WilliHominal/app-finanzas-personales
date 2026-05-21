import { useEffect, useState, type FormEvent } from "react";
import { obtenerPreciosCedears } from "../instrumentos/instrumentos.api";
import { crearTenencia } from "./tenencias.servicio";

interface Props {
  onGuardada: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormularioTenencia({ onGuardada }: Props) {
  const [nombre, setNombre] = useState("");
  const [simbolo, setSimbolo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [simbolos, setSimbolos] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerPreciosCedears().then((precios) => {
      if (precios) {
        setSimbolos(precios.map((precio) => precio.simbolo).sort());
      }
    });
  }, []);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) {
      setError("Poné un nombre para la tenencia.");
      return;
    }
    if (!simbolo.trim()) {
      setError("Indicá el símbolo del instrumento.");
      return;
    }
    const cantidadNumero = Number(cantidad);
    if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
      setError("La cantidad inicial tiene que ser un número mayor a cero.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      await crearTenencia({
        nombre: nombre.trim(),
        simbolo: simbolo.trim().toUpperCase(),
        cantidadInicial: cantidadNumero.toString(),
        fecha: hoy(),
      });
      setNombre("");
      setSimbolo("");
      setCantidad("");
      onGuardada();
    } catch (e) {
      setError(`No se pudo crear la tenencia: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo campo-ancho">
        <label htmlFor="ten-nombre">Nombre</label>
        <input
          id="ten-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: SPY en IOL"
        />
      </div>
      <div className="campo">
        <label htmlFor="ten-simbolo">Instrumento</label>
        <input
          id="ten-simbolo"
          list="lista-cedears"
          value={simbolo}
          onChange={(e) => setSimbolo(e.target.value.toUpperCase())}
          placeholder="SPY"
        />
        <datalist id="lista-cedears">
          {simbolos.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <div className="campo">
        <label htmlFor="ten-cantidad">Cantidad inicial</label>
        <input
          id="ten-cantidad"
          type="number"
          step="0.0001"
          min="0"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="180"
        />
      </div>
      <button type="submit" className="boton-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Crear tenencia"}
      </button>
      <p className="nota">
        La cantidad inicial entra como Apertura — no mueve plata de ninguna
        otra cuenta. Las compras posteriores se registran como movimientos.
      </p>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
