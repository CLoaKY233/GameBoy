// src-tauri/src/utils/windows.rs
use std::process::Command;

pub fn is_admin() -> bool {
    if !cfg!(target_os = "windows") {
        return false;
    }

    match Command::new("net").args(["session"]).output() {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}
