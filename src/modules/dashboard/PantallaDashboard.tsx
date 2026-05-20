import { useCallback, useEffect, useState } from "react";
import { formatearMonto } from "../../shared/formato";
import { listarMonedas, type Moneda } from "../../shared/monedas";
import { listarCuentas } from "../cuentas/cuentas.repositorio";
import { BLOQUE_DE_TIPO, ORDEN_BLOQUES, type Cuenta } from "../cuentas/cuentas.tipos";
import { listarMovimientos } from "../movimientos/movimientos.repositorio";
import { calcularSaldos } from "./saldos";
import "./dashboard.css";

export function PantallaDashboard() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [saldos, setSaldos] = useState<Map<number, string>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setError("");
      const [todasLasCuentas, movimientos, listaMonedas] = await Promise.all([
        listarCuentas(),
        listarMovimientos(),
        listarMonedas(),
      ]);
      const activas = todasLasCuentas.filter((c) => c.estado === "Activa");
      const resultado = await calcularSaldos(
        activas.map((c) => c.id),
        movimientos,
      );
      setCuentas(activas);
      setMonedas(listaMonedas);
      setSaldos(new Map(resultado.map((s) => [s.cuentaId, s.saldo])));
    } catch (e) {
      setError(`No se pudo cargar el tablero: ${e}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function codigoMoneda(monedaId: number): string {
    return monedas.find((m) => m.id === monedaId)?.codigo ?? "";
  }

  return (
    <section>
      <header className="pantalla-encabezado">
        <h2>Dashboard</h2>
        <p>Tus cuentas agrupadas por bloque de liquidez, con su saldo actual.</p>
      </header>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando…</p>
      ) : cuentas.length === 0 ? (
        <p className="vacio">
          No hay cuentas activas. Creá una en la sección Cuentas.
        </p>
      ) : (
        ORDEN_BLOQUES.map((bloque) => {
          const cuentasDelBloque = cuentas.filter(
            (c) => BLOQUE_DE_TIPO[c.tipo] === bloque,
          );
          if (cuentasDelBloque.length === 0) return null;
          return (
            <div key={bloque} className="bloque">
              <h3 className="bloque-titulo">{bloque}</h3>
              <table className="tabla">
                <tbody>
                  {cuentasDelBloque.map((cuenta) => (
                    <tr key={cuenta.id}>
                      <td>{cuenta.nombre}</td>
                      <td className="monto celda-saldo">
                        {formatearMonto(saldos.get(cuenta.id) ?? "0")}{" "}
                        {codigoMoneda(cuenta.monedaId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </section>
  );
}
