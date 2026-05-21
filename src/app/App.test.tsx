import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

vi.mock("../modules/parametros/cotizaciones.servicio", () => ({
  sincronizarCotizaciones: vi.fn().mockResolvedValue(false),
}));

vi.mock("../modules/recurrencia/recurrencia.servicio", () => ({
  aplicarReglasAutomaticas: vi.fn().mockResolvedValue(0),
}));

vi.mock("../modules/rendimientos/rendimientos.servicio", () => ({
  acreditarInteresPendiente: vi.fn().mockResolvedValue(0),
  obtenerRendimientos: vi.fn().mockResolvedValue([]),
}));

describe("App", () => {
  it("muestra la marca de la aplicación", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Finanzas" }),
    ).toBeInTheDocument();
  });
});
