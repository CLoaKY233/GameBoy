mod power_manager;
mod system_monitor;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            power_manager::switcher,
            power_manager::get_current_settings,
            system_monitor::get_system_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
