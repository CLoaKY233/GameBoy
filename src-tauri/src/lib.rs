// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use pyo3::prelude::*;
use std::fs;

#[tauri::command]
fn switcher(alpha: &str, beta: &str, gamma: &str) -> String {
    // println!("{} {} {}", alpha, beta, gamma);

    let python_code = match fs::read_to_string("pyfiles/switchmode.py") {
        Ok(code) => code,
        Err(e) => return format!("Error reading Python file: {}", e),
    };

    match Python::with_gil(|py| -> Result<String, String> {
        let switchscript = PyModule::from_code(py, &python_code, "switchmode.py", "switchmode")
            .map_err(|e| format!("Python module error: {}", e))?;

        let result: String = switchscript // Changed from i32 to String
            .getattr("set_processor_power_settings")
            .map_err(|e| format!("Function error: {}", e))?
            .call1((alpha, beta, gamma))
            .map_err(|e| format!("Call error: {}", e))?
            .extract()
            .map_err(|e| format!("Extract error: {}", e))?;

        Ok(result) // Return the result directly without formatting
    }) {
        Ok(message) => message,
        Err(e) => format!("Error: {}", e),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![switcher])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
