import { useState, type FormEvent } from "react";
import { formatearMonto } from "../../shared/formato";
import type { Moneda } from "../../shared/monedas";
import type { Cuenta } from "../cuentas/cuentas.tipos";
import type { Categoria } from "../parametros/categorias.tipos";
import { actualizarMovimiento, crearMovimiento } from "./movimientos.repositorio";
import {
  TIPOS_MOVIMIENTO,
  type Movimiento,
  type NuevoMovimiento,
  type TipoMovimiento,
} from "./movimientos.tipos";

interface Props {
  cuentas: Cuenta[];
  monedas: Moneda[];
  categorias: Categoria[];
  movimientoAEditar: Movimiento | null;
  onGuardado: () => void;
  onCancelar: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function cuentaInicial(movimiento: Movimiento | null): string {
  if (!movimiento || movimiento.tipo === "Transferencia") return "";
  const id =
    movimiento.tipo === "Gasto"
      ? movimiento.cuentaOrigenId
      : movimiento.cuentaDestinoId;
  return id !== null ? String(id) : "";
}

function montoInicial(movimiento: Movimiento | null): string {
  if (!movimiento || movimiento.tipo === "Transferencia") return "";
  return (
    (movimiento.tipo === "Gasto"
      ? movimiento.montoOrigen
      : movimiento.montoDestino) ?? ""
  );
}

export function FormularioMovimiento({
  cuentas,
  monedas,
  categorias,
  movimientoAEditar,
  onGuardado,
  onCancelar,
}: Props) {
  const editar = movimientoAEditar;
  const editando = editar !== null;
  const esTransferenciaEditada = editar?.tipo === "Transferencia";
  // Una apertura ya no se elige a mano, pero las existentes (saldos iniciales,
  // tenencias, préstamos) siguen siendo editables: monto, fecha y descripción,
  // sin poder cambiarles el tipo.
  const editandoApertura = editar?.tipo === "Apertura";

  const [tipo, setTipo] = useState<TipoMovimiento>(editar?.tipo ?? "Gasto");
  const [fecha, setFecha] = useState(editar?.fecha ?? hoy());
  const [descripcion, setDescripcion] = useState(editar?.descripcion ?? "");
  const [cuentaId, setCuentaId] = useState(cuentaInicial(editar));
  const [monto, setMonto] = useState(montoInicial(editar));
  const [categoriaId, setCategoriaId] = useState(
    editar?.categoriaId != null ? String(editar.categoriaId) : "",
  );
  const [cuentaOrigenId, setCuentaOrigenId] = useState(
    esTransferenciaEditada && editar.cuentaOrigenId != null
      ? String(editar.cuentaOrigenId)
      : "",
  );
  const [cuentaDestinoId, setCuentaDestinoId] = useState(
    esTransferenciaEditada && editar.cuentaDestinoId != null
      ? String(editar.cuentaDestinoId)
      : "",
  );
  const [montoOrigen, setMontoOrigen] = useState(
    esTransferenciaEditada ? (editar.montoOrigen ?? "") : "",
  );
  const [montoDestino, setMontoDestino] = useState(
    esTransferenciaEditada ? (editar.montoDestino ?? "") : "",
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const esTransferencia = tipo === "Transferencia";
  const usaCategoria = tipo === "Ingreso" || tipo === "Gasto";
  const categoriasDelTipo = categorias.filter((c) => c.tipo === tipo);

  function monedaDe(idTexto: string): number | null {
    if (!idTexto) return null;
    return cuentas.find((c) => c.id === Number(idTexto))?.monedaId ?? null;
  }
  const esCanje =
    esTransferencia &&
    cuentaOrigenId !== "" &&
    cuentaDestinoId !== "" &&
    monedaDe(cuentaOrigenId) !== monedaDe(cuentaDestinoId);

  function monedaPorCuenta(idTexto: string): Moneda | undefined {
    const id = monedaDe(idTexto);
    return id === null ? undefined : monedas.find((m) => m.id === id);
  }

  /**
   * En un canje contra un instrumento, sugiere el monto en pesos: el lado en
   * pesos vale `unidades × precio`. La sugerencia es editable — el monto real
   * lo pone el usuario.
   */
  function sugerirCanje(): { campo: "origen" | "destino"; monto: string } | null {
    if (!esCanje) return null;
    const destino = monedaPorCuenta(cuentaDestinoId);
    if (
      destino?.tipo === "Instrumento" &&
      destino.precio &&
      montoValido(montoDestino)
    ) {
      return {
        campo: "origen",
        monto: (Number(montoDestino) * Number(destino.precio)).toFixed(2),
      };
    }
    const origen = monedaPorCuenta(cuentaOrigenId);
    if (
      origen?.tipo === "Instrumento" &&
      origen.precio &&
      montoValido(montoOrigen)
    ) {
      return {
        campo: "destino",
        monto: (Number(montoOrigen) * Number(origen.precio)).toFixed(2),
      };
    }
    return null;
  }

  function cambiarTipo(nuevoTipo: TipoMovimiento) {
    setTipo(nuevoTipo);
    setCategoriaId("");
  }

  function montoValido(valor: string): boolean {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0;
  }

  function construirDatos(): NuevoMovimiento | string {
    if (esTransferencia) {
      if (!cuentaOrigenId || !cuentaDestinoId) {
        return "Elegí la cuenta de origen y la de destino.";
      }
      if (cuentaOrigenId === cuentaDestinoId) {
        return "La cuenta de origen y la de destino deben ser distintas.";
      }
      if (!montoValido(montoOrigen)) {
        return "El monto que sale tiene que ser mayor a cero.";
      }
      if (esCanje && !montoValido(montoDestino)) {
        return "El monto que entra tiene que ser mayor a cero.";
      }
      const salida = Number(montoOrigen).toFixed(2);
      const entrada = esCanje ? Number(montoDestino).toFixed(2) : salida;
      return {
        fecha,
        descripcion: descripcion.trim(),
        tipo: "Transferencia",
        cuentaOrigenId: Number(cuentaOrigenId),
        cuentaDestinoId: Number(cuentaDestinoId),
        montoOrigen: salida,
        montoDestino: entrada,
        categoriaId: null,
        reglaRecurrenteId: null,
      };
    }

    if (!cuentaId) return "Elegí una cuenta.";
    if (!montoValido(monto)) return "El monto tiene que ser un número mayor a cero.";
    if (usaCategoria && !categoriaId) return "Elegí una categoría.";

    const esEgreso = tipo === "Gasto";
    const montoTexto = Number(monto).toFixed(2);
    return {
      fecha,
      descripcion:
        descripcion.trim() || (tipo === "Apertura" ? "Saldo inicial" : ""),
      tipo,
      cuentaOrigenId: esEgreso ? Number(cuentaId) : null,
      cuentaDestinoId: esEgreso ? null : Number(cuentaId),
      montoOrigen: esEgreso ? montoTexto : null,
      montoDestino: esEgreso ? null : montoTexto,
      categoriaId: usaCategoria ? Number(categoriaId) : null,
      reglaRecurrenteId: null,
    };
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    const datos = construirDatos();
    if (typeof datos === "string") {
      setError(datos);
      return;
    }
    setError("");
    setGuardando(true);
    try {
      if (editar) {
        await actualizarMovimiento(editar.id, datos);
      } else {
        await crearMovimiento(datos);
        setMonto("");
        setMontoOrigen("");
        setMontoDestino("");
        setDescripcion("");
        setCategoriaId("");
      }
      onGuardado();
    } catch (e) {
      setError(`No se pudo registrar el movimiento: ${e}`);
    } finally {
      setGuardando(false);
    }
  }

  const sugerido = sugerirCanje();

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo">
        <label htmlFor="mov-tipo">Tipo</label>
        <select
          id="mov-tipo"
          value={tipo}
          onChange={(e) => cambiarTipo(e.target.value as TipoMovimiento)}
          disabled={editandoApertura}
        >
          {editandoApertura && <option value="Apertura">Apertura</option>}
          {TIPOS_MOVIMIENTO.map((t) => (
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

      {esTransferencia ? (
        <>
          <div className="campo">
            <label htmlFor="mov-origen">Cuenta de origen</label>
            <select
              id="mov-origen"
              value={cuentaOrigenId}
              onChange={(e) => setCuentaOrigenId(e.target.value)}
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
            <label htmlFor="mov-destino">Cuenta de destino</label>
            <select
              id="mov-destino"
              value={cuentaDestinoId}
              onChange={(e) => setCuentaDestinoId(e.target.value)}
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
            <label htmlFor="mov-monto-origen">
              {esCanje ? "Monto que sale" : "Monto"}
            </label>
            <input
              id="mov-monto-origen"
              type="number"
              step="0.01"
              min="0"
              value={montoOrigen}
              onChange={(e) => setMontoOrigen(e.target.value)}
              placeholder="0,00"
            />
            {sugerido?.campo === "origen" && (
              <button
                type="button"
                className="boton-tenue"
                onClick={() => setMontoOrigen(sugerido.monto)}
              >
                Precio sugerido: $ {formatearMonto(sugerido.monto)}
              </button>
            )}
          </div>
          {esCanje && (
            <div className="campo">
              <label htmlFor="mov-monto-destino">Monto que entra</label>
              <input
                id="mov-monto-destino"
                type="number"
                step="0.01"
                min="0"
                value={montoDestino}
                onChange={(e) => setMontoDestino(e.target.value)}
                placeholder="0,00"
              />
              {sugerido?.campo === "destino" && (
                <button
                  type="button"
                  className="boton-tenue"
                  onClick={() => setMontoDestino(sugerido.monto)}
                >
                  Precio sugerido: $ {formatearMonto(sugerido.monto)}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
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
        </>
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
        {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Registrar"}
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
