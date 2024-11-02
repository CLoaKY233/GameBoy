// src-tauri/src/commands.rs
use crate::services::power::PowerService;
use tauri::Runtime;

#[tauri::command(rename_all = "camelCase")]
pub async fn switcher<R: Runtime>(
    _handle: tauri::AppHandle<R>,
    boost_mode: String,
    max_processor_state: String,
    power_type: String,
) -> Result<String, String> {
    let power_service = PowerService::new();
    match power_service.set_power_settings(&boost_mode, &max_processor_state, &power_type) {
        Ok(messages) => Ok(messages.join("\n")),
        Err(e) => Err(format!("Error: {}", e)),
    }
}
