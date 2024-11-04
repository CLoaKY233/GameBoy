// power_manager.rs
use std::collections::HashMap;
use std::process::Command;

pub struct PowerManager {
    boost_modes: HashMap<i32, &'static str>,
}

impl PowerManager {
    pub fn new() -> Self {
        let mut modes = HashMap::new();
        modes.insert(0, "Disabled");
        modes.insert(1, "Enabled");
        modes.insert(2, "Aggressive");
        modes.insert(3, "Efficient Enabled");
        modes.insert(4, "Efficient Aggressive");
        modes.insert(5, "Aggressive At Guaranteed");
        modes.insert(6, "Efficient Aggressive At Guaranteed");
        Self { boost_modes: modes }
    }
}

pub fn is_admin() -> bool {
    if !cfg!(target_os = "windows") {
        return false;
    }
    match Command::new("net").args(["session"]).output() {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

#[tauri::command]
pub async fn get_current_settings() -> Result<HashMap<String, i32>, String> {
    if !is_admin() {
        return Err("❌ Administrator privileges required to read settings".to_string());
    }

    let mut settings = HashMap::new();
    let scheme_guid = get_active_scheme()?;

    // Constants for GUIDs
    const PROCESSOR_SUBGROUP: &str = "54533251-82be-4824-96c1-47b60b740d00";
    const BOOST_GUID: &str = "be337238-0d82-4146-a960-4f3749d470c7";
    const MAX_PROC_GUID: &str = "bc5038f7-23e0-4960-96da-33abaf5935ec";

    // Get boost mode settings
    let output = Command::new("powercfg")
        .args(&["/query", &scheme_guid, PROCESSOR_SUBGROUP, BOOST_GUID])
        .output()
        .map_err(|e| format!("❌ Failed to get boost mode: {}", e))?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    // Parse boost mode settings
    settings.insert(
        "acBoostMode".to_string(),
        parse_powercfg_output(&output_str, "AC").unwrap_or(1),
    );
    settings.insert(
        "dcBoostMode".to_string(),
        parse_powercfg_output(&output_str, "DC").unwrap_or(1),
    );

    // Get processor state settings
    let output = Command::new("powercfg")
        .args(&["/query", &scheme_guid, PROCESSOR_SUBGROUP, MAX_PROC_GUID])
        .output()
        .map_err(|e| format!("❌ Failed to get processor state: {}", e))?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    // Parse processor state settings (convert from hex percentage)
    settings.insert(
        "acMaxProcessorState".to_string(),
        parse_powercfg_output(&output_str, "AC").unwrap_or(100),
    );
    settings.insert(
        "dcMaxProcessorState".to_string(),
        parse_powercfg_output(&output_str, "DC").unwrap_or(100),
    );

    // println!("Parsed settings: {:?}", settings);
    Ok(settings)
}

fn parse_powercfg_output(output: &str, power_type: &str) -> Option<i32> {
    for line in output.lines() {
        if line.contains(&format!("Current {} Power Setting Index:", power_type)) {
            // Extract the hex value
            if let Some(hex_str) = line.split("0x").nth(1) {
                // Convert hex to decimal
                if let Ok(value) = i32::from_str_radix(hex_str.trim(), 16) {
                    return Some(value);
                }
            }
        }
    }
    None
}

#[tauri::command]
pub async fn switcher(
    boost_mode: String,
    max_processor_state: String,
    power_type: String,
) -> Result<String, String> {
    // Check admin privileges
    if !is_admin() {
        return Err("❌ This function requires administrator privileges!".to_string());
    }

    let power_manager = PowerManager::new();

    // Validate boost mode
    let boost_mode: i32 = boost_mode
        .parse()
        .map_err(|_| "❌ Invalid boost mode value")?;
    if !power_manager.boost_modes.contains_key(&boost_mode) {
        return Err("❌ Invalid boost mode selection".to_string());
    }

    // Validate processor state
    let max_processor_state: i32 = max_processor_state
        .parse()
        .map_err(|_| "❌ Invalid processor state")?;

    if max_processor_state < 20 || max_processor_state > 100 {
        return Err("❌ Processor state must be between 20 and 100".to_string());
    }

    let power_type = power_type.to_lowercase();
    if !["ac", "dc", "both"].contains(&power_type.as_str()) {
        return Err("❌ Power type must be 'ac', 'dc', or 'both'".to_string());
    }

    // Get active power scheme
    let scheme_guid = get_active_scheme()?;
    let mut messages = Vec::new();

    messages.push(format!(
        "✓ Setting processor boost mode to: {}",
        power_manager.boost_modes.get(&boost_mode).unwrap()
    ));

    // Apply settings based on power type
    if power_type == "ac" || power_type == "both" {
        apply_power_settings(
            &scheme_guid,
            "ac",
            boost_mode,
            max_processor_state,
            &mut messages,
        )?;
    }
    if power_type == "dc" || power_type == "both" {
        apply_power_settings(
            &scheme_guid,
            "dc",
            boost_mode,
            max_processor_state,
            &mut messages,
        )?;
    }

    // Apply changes
    Command::new("powercfg")
        .args(&["/setactive", &scheme_guid])
        .output()
        .map_err(|e| format!("❌ Failed to apply changes: {}", e))?;

    messages.push("✨ All power settings applied successfully!".to_string());
    Ok(messages.join("\n"))
}

fn get_active_scheme() -> Result<String, String> {
    let output = Command::new("powercfg")
        .args(&["/getactivescheme"])
        .output()
        .map_err(|e| format!("❌ Failed to get active scheme: {}", e))?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    output_str
        .split_whitespace()
        .nth(3)
        .map(String::from)
        .ok_or_else(|| "❌ Failed to get scheme GUID".to_string())
}

fn apply_power_settings(
    scheme_guid: &str,
    power_type: &str,
    boost_mode: i32,
    max_processor_state: i32,
    messages: &mut Vec<String>,
) -> Result<(), String> {
    const PROCESSOR_SUBGROUP: &str = "54533251-82be-4824-96c1-47b60b740d00";
    const BOOST_GUID: &str = "be337238-0d82-4146-a960-4f3749d470c7";
    const MAX_PROC_GUID: &str = "bc5038f7-23e0-4960-96da-33abaf5935ec";

    // Set boost mode
    let cmd_type = if power_type == "ac" {
        "setacvalueindex"
    } else {
        "setdcvalueindex"
    };

    Command::new("powercfg")
        .args(&[
            cmd_type,
            scheme_guid,
            PROCESSOR_SUBGROUP,
            BOOST_GUID,
            &boost_mode.to_string(),
        ])
        .output()
        .map_err(|e| format!("❌ Failed to set boost mode: {}", e))?;

    messages.push(format!(
        "✓ {} Power: Boost mode updated successfully",
        power_type.to_uppercase()
    ));

    // Set max processor state
    Command::new("powercfg")
        .args(&[
            cmd_type,
            scheme_guid,
            PROCESSOR_SUBGROUP,
            MAX_PROC_GUID,
            &max_processor_state.to_string(),
        ])
        .output()
        .map_err(|e| format!("❌ Failed to set processor state: {}", e))?;

    messages.push(format!(
        "✓ {} Power: Maximum processor state set to {}%",
        power_type.to_uppercase(),
        max_processor_state
    ));

    Ok(())
}
