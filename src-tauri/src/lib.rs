use pyo3::prelude::*;
use std::fs;
#[allow(unused_imports)]
use tauri::path::PathResolver;
use tauri::Manager;
use tauri::Runtime; // Corrected import path

#[tauri::command]
fn switcher<R: Runtime>(
    handle: tauri::AppHandle<R>,
    alpha: &str,
    beta: &str,
    gamma: &str,
) -> String {
    // Get the path to your Python file from the resources
    let resource_path = match handle.path().resource_dir() {
        Ok(dir) => dir.join("pyfiles/switchmode.py"),
        Err(e) => return format!("Error: Could not resolve resource directory: {}", e),
    };

    let python_code = match fs::read_to_string(resource_path) {
        Ok(code) => code,
        Err(e) => return format!("Error reading Python file: {}", e),
    };

    match Python::with_gil(|py| -> Result<String, String> {
        let switchscript = PyModule::from_code(py, &python_code, "switchmode.py", "switchmode")
            .map_err(|e| format!("Python module error: {}", e))?;

        let result: String = switchscript
            .getattr("set_processor_power_settings")
            .map_err(|e| format!("Function error: {}", e))?
            .call1((alpha, beta, gamma))
            .map_err(|e| format!("Call error: {}", e))?
            .extract()
            .map_err(|e| format!("Extract error: {}", e))?;

        Ok(result)
    }) {
        Ok(message) => message,
        Err(e) => format!("Error: {}", e),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Load and verify the Python file is accessible during setup
            let resource_path = app
                .path()
                .resource_dir()
                .map(|dir| dir.join("python/switchmode.py"))
                .expect("failed to resolve resource directory");

            // You can add verification here if needed
            match fs::read_to_string(&resource_path) {
                Ok(_) => println!("Python file loaded successfully"),
                Err(e) => println!("Error loading Python file: {}", e),
            }

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![switcher])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
