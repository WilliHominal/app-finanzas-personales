import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renderiza el nombre de la aplicación", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Finanzas" })).toBeInTheDocument();
  });
});
