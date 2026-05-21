import { invoke } from "@tauri-apps/api/core";

function fechaDeHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function marcaTemporal(): string {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
}

/**
 * Respalda la base de datos al abrir la app. Un fallo de respaldo no debe
 * impedir el arranque, así que el error se traga a propósito.
 */
export async function crearRespaldoAutomatico(): Promise<void> {
  try {
    await invoke("crear_respaldo", { fecha: fechaDeHoy() });
  } catch {
    // sin respaldo, pero la app abre igual
  }
}

/** Exporta una copia de la base a la carpeta de descargas; devuelve la ruta. */
export function exportarRespaldo(): Promise<string> {
  return invoke<string>("exportar_respaldo", { marca: marcaTemporal() });
}

/** Nombres de los respaldos automáticos, del más reciente al más antiguo. */
export function listarRespaldos(): Promise<string[]> {
  return invoke<string[]>("listar_respaldos");
}
