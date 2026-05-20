import { useState, type FormEvent } from "react";
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
  categorias: Categoria[];
  movimientoAEditar: Movimiento | null;
  onGuardado: () => void;
  onCancelar: () => void;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormularioMovimiento({
  cuentas,
  categorias,
  movimientoAEditar,
  onGuardado,
  onCancelar,
}: Props) {
  const editar = movimientoAEditar;
  const editando = editar !== null;

  const [tipo, setTipo] = useState<TipoMovimiento>(editar?.tipo ?? "Gasto");
  const [fecha, setFecha] = useState(editar?.fecha ?? hoy());
  const [descripcion, setDescripcion] = useState(editar?.descripcion ?? "");

  // Modo simple: Apertura / Ingreso / Gasto.
  const [cuentaId, setCuentaId] = useState(() => {
    if (!editar || editar.tipo === "Transferencia") return "";
    const id = editar.tipo === "Gasto" ? editar.cuentaOrigenId : editar.cuentaDestinoId;
    return id != null ? String(id) : "";
  });
  const [monto, setMonto] = useState(() => {
    if (!editar || editar.tipo === "Transferencia") return "";
    return (editar.tipo === "Gasto" ? editar.montoOrigen : editar.montoDestino) ?? "";
  });
  const [categoriaId, setCategoriaId] = useState(
    editar?.categoriaId != null ? String(editar.categoriaId) : "",
  );

  // Modo transferencia / canje.
  const esTransferenciaEditada = editar?.tipo === "Transferencia";
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
      };
    }

    if (!cuentaId) return "Elegí una cuenta.";
    if (!montoValido(monto)) return "El monto tiene que ser mayor a cero.";
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

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <div className="campo">
        <label htmlFor="mov-tipo">Tipo</label>
        <select
          id="mov-tipo"
          value={tipo}
          onChange={(e) => cambiarTipo(e.target.value as TipoMovimiento)}
        >
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
