import { useState } from "react";
import { formatearMonto } from "../../shared/formato";
import type { Cotizacion } from "./cotizaciones.tipos";

type Direccion = "dolaresAPesos" | "pesosADolares";

interface Props {
  cotizaciones: Cotizacion[];
}

export function Calculadora({ cotizaciones }: Props) {
  const [monto, setMonto] = useState("");
  const [direccion, setDireccion] = useState<Direccion>("dolaresAPesos");
  const [cotizacionId, setCotizacionId] = useState("");

  const cotizacion = cotizaciones.find((c) => String(c.id) === cotizacionId);
  const valor = cotizacion ? Number(cotizacion.valor) : 0;
  const montoNumero = Number(monto);

  let resultado: string | null = null;
  if (Number.isFinite(montoNumero) && montoNumero > 0 && valor > 0) {
    const calculado =
      direccion === "dolaresAPesos" ? montoNumero * valor : montoNumero / valor;
    resultado = formatearMonto(calculado.toFixed(2));
  }
  const monedaResultado = direccion === "dolaresAPesos" ? "ARS" : "USD";

  return (
    <div>
      <h3 className="bloque-titulo">Calculadora de conversión</h3>
      <div className="formulario">
        <div className="campo">
          <label htmlFor="calc-monto">Monto</label>
          <input
            id="calc-monto"
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="campo">
          <label htmlFor="calc-direccion">Conversión</label>
          <select
            id="calc-direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value as Direccion)}
          >
            <option value="dolaresAPesos">Dólares → Pesos</option>
            <option value="pesosADolares">Pesos → Dólares</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="calc-cotizacion">Cotización</label>
          <select
            id="calc-cotizacion"
            value={cotizacionId}
            onChange={(e) => setCotizacionId(e.target.value)}
          >
            <option value="">Elegí…</option>
            {cotizaciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="resultado-calculo">
        {resultado
          ? `= ${resultado} ${monedaResultado}`
          : "Ingresá un monto y elegí una cotización."}
      </p>
    </div>
  );
}
