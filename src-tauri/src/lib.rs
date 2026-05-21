mod comandos;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(db::DB_URL, db::migraciones())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            comandos::resumen_patrimonial,
            comandos::calcular_rendimientos,
            comandos::proyectar,
            comandos::crear_respaldo,
            comandos::exportar_respaldo,
            comandos::listar_respaldos
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
