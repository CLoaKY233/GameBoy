#[cfg(windows)]
use nvml_wrapper::{enum_wrappers::device::TemperatureSensor, Nvml};
use serde::{Deserialize, Serialize};
use sysinfo::{CpuExt, System, SystemExt};

#[derive(Serialize, Deserialize, Debug)]
pub struct SystemInfo {
    #[serde(rename = "cpuModel")]
    pub cpu_model: String,
    #[serde(rename = "cpuUsage")]
    pub cpu_usage: f32,
    #[serde(rename = "memoryTotal")]
    pub memory_total: u64,
    #[serde(rename = "memoryUsed")]
    pub memory_used: u64,
    #[serde(rename = "memoryAvailable")]
    pub memory_available: u64,
    #[serde(rename = "memoryUsage")]
    pub memory_usage: f32,
    #[serde(rename = "gpuModel")]
    pub gpu_model: String,
    #[serde(rename = "gpuTemperature")]
    pub gpu_temperature: f32,
    #[serde(rename = "gpuUsage")]
    pub gpu_usage: f32,
    #[serde(rename = "gpuMemoryUsed")]
    pub gpu_memory_used: u64,
    #[serde(rename = "gpuMemoryTotal")]
    pub gpu_memory_total: u64,
}

#[tauri::command]
pub fn get_system_stats() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    #[cfg(windows)]
    let nvml = Nvml::init().ok();

    let cpu_model = sys
        .cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let cpu_usage =
        sys.cpus().iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / sys.cpus().len() as f32;

    let memory_total = sys.total_memory() / 1024 / 1024;
    let memory_used = sys.used_memory() / 1024 / 1024;
    let memory_available = sys.available_memory() / 1024 / 1024;
    let memory_usage = (memory_used as f32 / memory_total as f32) * 100.0;

    #[cfg(windows)]
    let (gpu_model, gpu_temperature, gpu_usage, gpu_memory_used, gpu_memory_total) =
        if let Some(nvml) = &nvml {
            if let Ok(device) = nvml.device_by_index(0) {
                (
                    device.name().unwrap_or_else(|_| "Unknown".to_string()),
                    device.temperature(TemperatureSensor::Gpu).unwrap_or(0) as f32,
                    device
                        .utilization_rates()
                        .map(|u| u.gpu as f32)
                        .unwrap_or(0.0),
                    device
                        .memory_info()
                        .map(|mem| mem.used / 1024 / 1024)
                        .unwrap_or(0),
                    device
                        .memory_info()
                        .map(|mem| mem.total / 1024 / 1024)
                        .unwrap_or(0),
                )
            } else {
                ("Unknown".to_string(), 0.0, 0.0, 0, 0)
            }
        } else {
            ("No NVIDIA GPU detected".to_string(), 0.0, 0.0, 0, 0)
        };

    #[cfg(not(windows))]
    let (gpu_model, gpu_temperature, gpu_usage, gpu_memory_used, gpu_memory_total) =
        ("N/A".to_string(), 0.0, 0.0, 0, 0);

    Ok(SystemInfo {
        cpu_model,
        cpu_usage,
        memory_total,
        memory_used,
        memory_available,
        memory_usage,
        gpu_model,
        gpu_temperature,
        gpu_usage,
        gpu_memory_used,
        gpu_memory_total,
    })
}
