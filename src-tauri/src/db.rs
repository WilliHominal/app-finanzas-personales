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
        Migration {
            version: 4,
            description: "crear_regla_recurrente",
            sql: include_str!("../migrations/0004_regla_recurrente.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "movimiento_regla_recurrente",
            sql: include_str!("../migrations/0005_movimiento_regla.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "crear_tasa_tna",
            sql: include_str!("../migrations/0006_tasa_tna.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "baja_tna_cuenta",
            sql: include_str!("../migrations/0007_baja_tna_cuenta.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "crear_prestamo",
            sql: include_str!("../migrations/0008_prestamo.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "regla_mes_aplicacion",
            sql: include_str!("../migrations/0009_regla_mes.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
