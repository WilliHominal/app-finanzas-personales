import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./cuentas.repositorio", () => ({
  crearCuenta: vi.fn(),
}));

vi.mock("../movimientos/movimientos.repositorio", () => ({
  crearMovimiento: vi.fn(),
}));

import { crearCuentaConSaldoInicial } from "./cuentas.servicio";
import { crearCuenta } from "./cuentas.repositorio";
import { crearMovimiento } from "../movimientos/movimientos.repositorio";
import type { NuevaCuenta } from "./cuentas.tipos";

const crearCuentaMock = vi.mocked(crearCuenta);
const crearMovimientoMock = vi.mocked(crearMovimiento);

const datosCuenta: NuevaCuenta = {
  nombre: "Caja",
  tipo: "Efectivo",
  monedaId: 1,
};

describe("crearCuentaConSaldoInicial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crearCuentaMock.mockResolvedValue(7);
  });

  it("crea la cuenta y devuelve su id", async () => {
    const id = await crearCuentaConSaldoInicial(datosCuenta, "");
    expect(crearCuentaMock).toHaveBeenCalledWith(datosCuenta);
    expect(id).toBe(7);
  });

  it("no registra apertura si el saldo inicial está vacío", async () => {
    await crearCuentaConSaldoInicial(datosCuenta, "");
    expect(crearMovimientoMock).not.toHaveBeenCalled();
  });

  it("no registra apertura si el saldo inicial es cero", async () => {
    await crearCuentaConSaldoInicial(datosCuenta, "0");
    expect(crearMovimientoMock).not.toHaveBeenCalled();
  });

  it("no registra apertura si el saldo inicial no es un número válido", async () => {
    await crearCuentaConSaldoInicial(datosCuenta, "abc");
    expect(crearMovimientoMock).not.toHaveBeenCalled();
  });

  it("registra una Apertura sobre la cuenta nueva cuando hay saldo inicial", async () => {
    await crearCuentaConSaldoInicial(datosCuenta, "1500.5");
    expect(crearMovimientoMock).toHaveBeenCalledTimes(1);
    expect(crearMovimientoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "Apertura",
        descripcion: "Saldo inicial",
        cuentaOrigenId: null,
        cuentaDestinoId: 7,
        montoOrigen: null,
        montoDestino: "1500.50",
        categoriaId: null,
        reglaRecurrenteId: null,
      }),
    );
  });
});
