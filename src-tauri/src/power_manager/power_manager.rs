use lazy_static::lazy_static;
use parking_lot::Mutex;
use std::collections::HashMap;
use std::process::Command;
use std::time::{Duration, Instant};

// Import Windows-specific traits and constants
#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
use winapi::um::winbase::CREATE_NO_WINDOW;

// Constants
const PROCESSOR_SUBGROUP: &str = "54533251-82be-4824-96c1-47b60b740d00";
const BOOST_GUID: &str = "be337238-0d82-4146-a960-4f3749d470c7";
const MAX_PROC_GUID: &str = "bc5038f7-23e0-4960-96da-33abaf5935ec";
const CACHE_DURATION: Duration = Duration::from_secs(5);

// Static configurations and caches
lazy_static! {
    static ref BOOST_MODES: HashMap<i32, &'static str> = {
        let mut m = HashMap::with_capacity(7);
        m.insert(0, "Disabled");
        m.insert(1, "Enabled");
        m.insert(2, "Aggressive");
        m.insert(3, "Efficient Enabled");
        m.insert(4, "Efficient Aggressive");
        m.insert(5, "Aggressive At Guaranteed");
        m.insert(6, "Efficient Aggressive At Guaranteed");
        m
    };
    static ref ACTIVE_SCHEME_CACHE: Mutex<Option<(String, Instant)>> = Mutex::new(None);
    static ref SETTINGS_CACHE: Mutex<Option<(HashMap<String, i32>, Instant)>> = Mutex::new(None);
}

pub fn is_admin() -> bool {
    if !cfg!(target_os = "windows") {
        return false;
    }
    let mut cmd = Command::new("net");
    cmd.args(["session"]);
    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd.output().map_or(false, |output| output.status.success())
}

fn parse_powercfg_output(output: &str, power_type: &str) -> Option<i32> {
    output
        .lines()
        .find(|line| line.contains(&format!("Current {} Power Setting Index:", power_type)))
        .and_then(|line| line.split("0x").nth(1))
        .and_then(|hex_str| i32::from_str_radix(hex_str.trim(), 16).ok())
}

fn get_active_scheme() -> Result<String, String> {
    // Check cache first
    if let Some((scheme, timestamp)) = ACTIVE_SCHEME_CACHE.lock().as_ref() {
        if timestamp.elapsed() < CACHE_DURATION {
            return Ok(scheme.clone());
        }
    }

    let mut cmd = Command::new("powercfg");
    cmd.args(&["/getactivescheme"]);
    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let output = cmd
        .output()
        .map_err(|e| format!("❌ Failed to get active scheme: {}", e))?;

    let scheme_guid = String::from_utf8_lossy(&output.stdout)
        .split_whitespace()
        .nth(3)
        .map(String::from)
        .ok_or_else(|| "❌ Failed to get scheme GUID".to_string())?;

    // Update cache
    *ACTIVE_SCHEME_CACHE.lock() = Some((scheme_guid.clone(), Instant::now()));

    Ok(scheme_guid)
}

#[tauri::command]
pub async fn get_current_settings() -> Result<HashMap<String, i32>, String> {
    if !is_admin() {
        return Err("❌ Administrator privileges required".to_string());
    }

    // Check cache
    if let Some((settings, timestamp)) = SETTINGS_CACHE.lock().as_ref() {
        if timestamp.elapsed() < CACHE_DURATION {
            return Ok(settings.clone());
        }
    }

    let mut settings = HashMap::with_capacity(4);
    let scheme_guid = get_active_scheme()?;

    // Parallel execution using rayon
    let (boost_output, proc_output) = rayon::join(
        || query_power_settings(&scheme_guid, BOOST_GUID),
        || query_power_settings(&scheme_guid, MAX_PROC_GUID),
    );

    let boost_str = boost_output?;
    let proc_str = proc_output?;

    settings.insert(
        "acBoostMode".to_string(),
        parse_powercfg_output(&boost_str, "AC").unwrap_or(1),
    );
    settings.insert(
        "dcBoostMode".to_string(),
        parse_powercfg_output(&boost_str, "DC").unwrap_or(1),
    );
    settings.insert(
        "acMaxProcessorState".to_string(),
        parse_powercfg_output(&proc_str, "AC").unwrap_or(100),
    );
    settings.insert(
        "dcMaxProcessorState".to_string(),
        parse_powercfg_output(&proc_str, "DC").unwrap_or(100),
    );

    // Update cache
    *SETTINGS_CACHE.lock() = Some((settings.clone(), Instant::now()));

    Ok(settings)
}

fn query_power_settings(scheme_guid: &str, setting_guid: &str) -> Result<String, String> {
    let mut cmd = Command::new("powercfg");
    cmd.args(&["/query", scheme_guid, PROCESSOR_SUBGROUP, setting_guid]);
    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let output = cmd
        .output()
        .map_err(|e| format!("❌ Failed to query power settings: {}", e))?;

    String::from_utf8(output.stdout).map_err(|e| format!("❌ Failed to parse output: {}", e))
}

#[tauri::command]
pub async fn switcher(
    boost_mode: String,
    max_processor_state: String,
    power_type: String,
) -> Result<String, String> {
    if !is_admin() {
        return Err("❌ Administrator privileges required".to_string());
    }

    let boost_mode: i32 = boost_mode
        .parse()
        .map_err(|_| "❌ Invalid boost mode value")?;

    if !BOOST_MODES.contains_key(&boost_mode) {
        return Err("❌ Invalid boost mode selection".to_string());
    }

    let max_processor_state: i32 = max_processor_state
        .parse()
        .map_err(|_| "❌ Invalid processor state")?;

    if !(20..=100).contains(&max_processor_state) {
        return Err("❌ Processor state must be between 20 and 100".to_string());
    }

    let power_type = power_type.to_lowercase();
    if !["ac", "dc", "both"].contains(&power_type.as_str()) {
        return Err("❌ Power type must be 'ac', 'dc', or 'both'".to_string());
    }

    let scheme_guid = get_active_scheme()?;
    let mut messages = Vec::with_capacity(4);

    messages.push(format!(
        "✓ Setting processor boost mode to: {}",
        BOOST_MODES.get(&boost_mode).unwrap()
    ));

    match power_type.as_str() {
        "both" => {
            // Run both operations and collect their results
            let (ac_result, dc_result) = rayon::join(
                || apply_power_settings(&scheme_guid, "ac", boost_mode, max_processor_state),
                || apply_power_settings(&scheme_guid, "dc", boost_mode, max_processor_state),
            );

            // Handle the results and add messages
            ac_result?;
            dc_result?;

            messages.push(format!(
                "✓ AC Power: Settings applied successfully\n✓ DC Power: Settings applied successfully"
            ));
        }
        _ => {
            apply_power_settings(&scheme_guid, &power_type, boost_mode, max_processor_state)?;
            messages.push(format!(
                "✓ {} Power: Settings applied successfully",
                power_type.to_uppercase()
            ));
        }
    }

    let mut cmd = Command::new("powercfg");
    cmd.args(&["/setactive", &scheme_guid]);
    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd.output()
        .map_err(|e| format!("❌ Failed to apply changes: {}", e))?;

    // Clear caches
    *SETTINGS_CACHE.lock() = None;
    *ACTIVE_SCHEME_CACHE.lock() = None;

    messages.push("✨ All power settings applied successfully!".to_string());
    Ok(messages.join("\n"))
}

fn apply_power_settings(
    scheme_guid: &str,
    power_type: &str,
    boost_mode: i32,
    max_processor_state: i32,
) -> Result<(), String> {
    let cmd_type = if power_type == "ac" {
        "setacvalueindex"
    } else {
        "setdcvalueindex"
    };

    // Set boost mode
    let mut cmd = Command::new("powercfg");
    cmd.args(&[
        cmd_type,
        scheme_guid,
        PROCESSOR_SUBGROUP,
        BOOST_GUID,
        &boost_mode.to_string(),
    ]);
    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd.output()
        .map_err(|e| format!("❌ Failed to set boost mode: {}", e))?;

    // Set max processor state
    let mut cmd2 = Command::new("powercfg");
    cmd2.args(&[
        cmd_type,
        scheme_guid,
        PROCESSOR_SUBGROUP,
        MAX_PROC_GUID,
        &max_processor_state.to_string(),
    ]);
    #[cfg(windows)]
    {
        cmd2.creation_flags(CREATE_NO_WINDOW);
    }
    cmd2.output()
        .map_err(|e| format!("❌ Failed to set processor state: {}", e))?;

    Ok(())
}
