import Database from "@tauri-apps/plugin-sql";

const URL_DB = "sqlite:finanzas.db";

let conexion: Promise<Database> | null = null;

/**
 * Devuelve la conexión a la base de datos, creándola una sola vez.
 * Las migraciones se aplican del lado de Rust al abrir la conexión.
 */
export function obtenerDb(): Promise<Database> {
  if (!conexion) {
    conexion = Database.load(URL_DB);
  }
  return conexion;
}
