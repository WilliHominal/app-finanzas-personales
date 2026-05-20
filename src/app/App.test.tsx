import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("muestra la marca de la aplicación", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Finanzas" }),
    ).toBeInTheDocument();
  });
});
