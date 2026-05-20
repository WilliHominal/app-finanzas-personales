//! Configuración de la base de datos y migraciones versionadas.

use tauri_plugin_sql::{Migration, MigrationKind};

/// Archivo SQLite de la aplicación. Se resuelve dentro del directorio de
/// datos de la app: garantiza privacidad y un backup trivial.
pub const DB_URL: &str = "sqlite:finanzas.db";

/// Lista ordenada de migraciones. Cada versión nueva se agrega al final;
/// una migración ya publicada nunca se modifica.
pub fn migraciones() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "crear_moneda_y_semilla",
            sql: include_str!("../migrations/0001_moneda.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "crear_cuenta_categoria_movimiento",
            sql: include_str!("../migrations/0002_cuenta_categoria_movimiento.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "crear_cotizacion",
            sql: include_str!("../migrations/0003_cotizacion.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
