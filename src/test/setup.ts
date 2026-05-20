import "@testing-library/jest-dom";
import { vi } from "vitest";

// La base de datos y los comandos viven en Tauri; en los tests se simulan.
vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: async () => ({
      select: async () => [],
      execute: async () => ({ rowsAffected: 0 }),
    }),
  },
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: async () => [],
}));
