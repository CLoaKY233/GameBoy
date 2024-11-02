use crate::models::power::PowerError;
use crate::utils::windows::is_admin;
use std::collections::HashMap;
use std::process::Command;

pub struct PowerService {
    boost_modes: HashMap<i32, &'static str>,
}

impl PowerService {
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

    pub fn set_power_settings(
        &self,
        boost_mode: &str,
        max_processor_state: &str,
        power_type: &str,
    ) -> Result<Vec<String>, PowerError> {
        // Admin check
        if !is_admin() {
            return Err(PowerError::NotAdmin);
        }

        // Parse and validate inputs
        let boost_mode: i32 = boost_mode
            .parse()
            .map_err(|_| PowerError::InvalidBoostMode)?;

        let max_processor_state: i32 = max_processor_state
            .parse()
            .map_err(|_| PowerError::InvalidProcessorState)?;

        // Validate processor state
        if max_processor_state < 20 || max_processor_state > 100 {
            return Err(PowerError::InvalidProcessorState);
        }

        // Validate power type
        let power_type = power_type.to_lowercase();
        if !["ac", "dc", "both"].contains(&power_type.as_str()) {
            return Err(PowerError::InvalidPowerType);
        }

        // Validate boost mode
        if !self.boost_modes.contains_key(&boost_mode) {
            return Err(PowerError::InvalidBoostMode);
        }

        let mut messages = Vec::new();

        // Get active power scheme
        let scheme_guid = self.get_active_scheme()?;

        messages.push(format!(
            "Setting processor boost mode to: {}",
            self.boost_modes.get(&boost_mode).unwrap()
        ));

        // Define GUIDs
        const PROCESSOR_SUBGROUP: &str = "54533251-82be-4824-96c1-47b60b740d00";
        const BOOST_GUID: &str = "be337238-0d82-4146-a960-4f3749d470c7";
        const MAX_PROC_GUID: &str = "bc5038f7-23e0-4960-96da-33abaf5935ec";

        // Apply AC settings if needed
        if power_type == "ac" || power_type == "both" {
            self.set_ac_settings(
                &scheme_guid,
                PROCESSOR_SUBGROUP,
                BOOST_GUID,
                MAX_PROC_GUID,
                boost_mode,
                max_processor_state,
                &mut messages,
            )?;
        }

        // Apply DC settings if needed
        if power_type == "dc" || power_type == "both" {
            self.set_dc_settings(
                &scheme_guid,
                PROCESSOR_SUBGROUP,
                BOOST_GUID,
                MAX_PROC_GUID,
                boost_mode,
                max_processor_state,
                &mut messages,
            )?;
        }

        // Apply the changes
        self.apply_changes(&scheme_guid)?;
        messages.push("All power settings applied successfully!".to_string());

        Ok(messages)
    }

    fn get_active_scheme(&self) -> Result<String, PowerError> {
        let output = Command::new("powercfg")
            .args(&["/getactivescheme"])
            .output()
            .map_err(|e| PowerError::CommandFailed(e.to_string()))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        output_str
            .split_whitespace()
            .nth(3)
            .map(String::from)
            .ok_or_else(|| PowerError::CommandFailed("Failed to get scheme GUID".to_string()))
    }

    fn set_ac_settings(
        &self,
        scheme_guid: &str,
        processor_subgroup: &str,
        boost_guid: &str,
        max_proc_guid: &str,
        boost_mode: i32,
        max_processor_state: i32,
        messages: &mut Vec<String>,
    ) -> Result<(), PowerError> {
        // Set AC boost mode
        Command::new("powercfg")
            .args(&[
                "/setacvalueindex",
                scheme_guid,
                processor_subgroup,
                boost_guid,
                &boost_mode.to_string(),
            ])
            .output()
            .map_err(|e| PowerError::CommandFailed(e.to_string()))?;

        messages.push("AC power boost mode updated successfully".to_string());

        // Set AC max processor state
        Command::new("powercfg")
            .args(&[
                "/setacvalueindex",
                scheme_guid,
                processor_subgroup,
                max_proc_guid,
                &max_processor_state.to_string(),
            ])
            .output()
            .map_err(|e| PowerError::CommandFailed(e.to_string()))?;

        messages.push("AC power maximum processor state updated successfully".to_string());
        Ok(())
    }

    fn set_dc_settings(
        &self,
        scheme_guid: &str,
        processor_subgroup: &str,
        boost_guid: &str,
        max_proc_guid: &str,
        boost_mode: i32,
        max_processor_state: i32,
        messages: &mut Vec<String>,
    ) -> Result<(), PowerError> {
        // Set DC boost mode
        Command::new("powercfg")
            .args(&[
                "/setdcvalueindex",
                scheme_guid,
                processor_subgroup,
                boost_guid,
                &boost_mode.to_string(),
            ])
            .output()
            .map_err(|e| PowerError::CommandFailed(e.to_string()))?;

        messages.push("DC power boost mode updated successfully".to_string());

        // Set DC max processor state
        Command::new("powercfg")
            .args(&[
                "/setdcvalueindex",
                scheme_guid,
                processor_subgroup,
                max_proc_guid,
                &max_processor_state.to_string(),
            ])
            .output()
            .map_err(|e| PowerError::CommandFailed(e.to_string()))?;

        messages.push("DC power maximum processor state updated successfully".to_string());
        Ok(())
    }

    fn apply_changes(&self, scheme_guid: &str) -> Result<(), PowerError> {
        Command::new("powercfg")
            .args(&["/setactive", scheme_guid])
            .output()
            .map_err(|e| PowerError::CommandFailed(e.to_string()))?;
        Ok(())
    }

    // Helper method to get available boost modes (could be useful for frontend)
    pub fn get_available_boost_modes(&self) -> HashMap<i32, &'static str> {
        self.boost_modes.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_power_service_initialization() {
        let service = PowerService::new();
        assert_eq!(service.boost_modes.len(), 7);
        assert_eq!(service.boost_modes.get(&0), Some(&"Disabled"));
        assert_eq!(service.boost_modes.get(&1), Some(&"Enabled"));
    }

    // Add more tests as needed...
}
