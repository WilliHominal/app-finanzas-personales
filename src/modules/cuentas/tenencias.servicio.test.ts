import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Moneda } from "../../shared/monedas";

vi.mock("../../shared/monedas", () => ({
  listarMonedas: vi.fn(),
}));

vi.mock("../instrumentos/instrumentos.repositorio", () => ({
  crearInstrumento: vi.fn(),
}));

vi.mock("../movimientos/movimientos.repositorio", () => ({
  crearMovimiento: vi.fn(),
}));

vi.mock("./cuentas.repositorio", () => ({
  crearCuenta: vi.fn(),
}));

vi.mock("../instrumentos/instrumentos.servicio", () => ({
  sincronizarPrecios: vi.fn(),
}));

import { crearTenencia } from "./tenencias.servicio";
import { listarMonedas } from "../../shared/monedas";
import { crearInstrumento } from "../instrumentos/instrumentos.repositorio";
import { crearCuenta } from "./cuentas.repositorio";
import { crearMovimiento } from "../movimientos/movimientos.repositorio";
import { sincronizarPrecios } from "../instrumentos/instrumentos.servicio";

const listarMonedasMock = vi.mocked(listarMonedas);
const crearInstrumentoMock = vi.mocked(crearInstrumento);
const crearCuentaMock = vi.mocked(crearCuenta);
const crearMovimientoMock = vi.mocked(crearMovimiento);
const sincronizarPreciosMock = vi.mocked(sincronizarPrecios);

const datos = {
  nombre: "SPY en IOL",
  simbolo: "spy",
  cantidadInicial: "306",
  fecha: "2026-05-22",
};

const spyExistente: Moneda = {
  id: 9,
  codigo: "SPY",
  simbolo: "SPY",
  tipo: "Instrumento",
  precio: "54900.00",
  precioActualizado: "2026-05-22",
};

describe("crearTenencia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarMonedasMock.mockResolvedValue([]);
    crearInstrumentoMock.mockResolvedValue(5);
    crearCuentaMock.mockResolvedValue(11);
    crearMovimientoMock.mockResolvedValue(undefined);
    sincronizarPreciosMock.mockResolvedValue(true);
  });

  it("crea el instrumento, la cuenta y el movimiento de apertura", async () => {
    await crearTenencia(datos);
    expect(crearInstrumentoMock).toHaveBeenCalledWith("SPY");
    expect(crearCuentaMock).toHaveBeenCalledWith({
      nombre: "SPY en IOL",
      tipo: "InversionesLargoPlazo",
      monedaId: 5,
    });
    expect(crearMovimientoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "Apertura",
        cuentaDestinoId: 11,
        montoDestino: "306",
      }),
    );
  });

  it("sincroniza los precios para que la tenencia nueva no quede en cero", async () => {
    await crearTenencia(datos);
    expect(sincronizarPreciosMock).toHaveBeenCalledTimes(1);
  });

  it("reutiliza el instrumento si el símbolo ya existe", async () => {
    listarMonedasMock.mockResolvedValue([spyExistente]);
    await crearTenencia(datos);
    expect(crearInstrumentoMock).not.toHaveBeenCalled();
    expect(crearCuentaMock).toHaveBeenCalledWith(
      expect.objectContaining({ monedaId: 9 }),
    );
  });
});
