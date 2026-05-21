import { describe, it, expect } from "vitest";
import { ocurrenciasHasta } from "./motor";

describe("ocurrenciasHasta", () => {
  it("no devuelve nada si la regla todavía no llegó a su día", () => {
    expect(ocurrenciasHasta("2026-05-01", null, 15, "2026-05-10")).toEqual([]);
  });

  it("devuelve una ocurrencia por mes hasta hoy", () => {
    expect(ocurrenciasHasta("2026-03-05", null, 5, "2026-05-10")).toEqual([
      "2026-03-05",
      "2026-04-05",
      "2026-05-05",
    ]);
  });

  it("ignora la primera ocurrencia si cae antes del inicio de vigencia", () => {
    expect(ocurrenciasHasta("2026-03-20", null, 5, "2026-05-10")).toEqual([
      "2026-04-05",
      "2026-05-05",
    ]);
  });

  it("respeta el fin de vigencia", () => {
    expect(
      ocurrenciasHasta("2026-01-10", "2026-03-10", 10, "2026-06-01"),
    ).toEqual(["2026-01-10", "2026-02-10", "2026-03-10"]);
  });

  it("cruza el cambio de año", () => {
    expect(ocurrenciasHasta("2025-11-01", null, 1, "2026-02-15")).toEqual([
      "2025-11-01",
      "2025-12-01",
      "2026-01-01",
      "2026-02-01",
    ]);
  });
});
