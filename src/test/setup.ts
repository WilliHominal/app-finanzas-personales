import "@testing-library/jest-dom";
import { vi } from "vitest";

// La base de datos vive en Tauri; en los tests se simula con datos vacíos.
vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: async () => ({
      select: async () => [],
      execute: async () => ({ rowsAffected: 0 }),
    }),
  },
}));
