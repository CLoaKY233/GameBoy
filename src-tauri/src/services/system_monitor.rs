// src-tauri/src/services/system_monitor.rs
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

pub struct SystemMonitor {
    sys: System,
    #[cfg(windows)]
    nvml: Option<Nvml>,
}

impl SystemMonitor {
    pub fn new() -> Self {
        let sys = System::new_all();
        #[cfg(windows)]
        let nvml = Nvml::init().ok();

        #[cfg(windows)]
        return SystemMonitor { sys, nvml };

        #[cfg(not(windows))]
        return SystemMonitor { sys };
    }

    pub fn get_system_info(&mut self) -> SystemInfo {
        self.sys.refresh_all();

        let cpu_model = self
            .sys
            .cpus()
            .first()
            .map(|cpu| cpu.brand().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        let cpu_usage = self
            .sys
            .cpus()
            .iter()
            .map(|cpu| cpu.cpu_usage())
            .sum::<f32>()
            / self.sys.cpus().len() as f32;

        let memory_total = self.sys.total_memory() / 1024 / 1024;
        let memory_used = self.sys.used_memory() / 1024 / 1024;
        let memory_available = self.sys.available_memory() / 1024 / 1024;
        let memory_usage = (memory_used as f32 / memory_total as f32) * 100.0;

        // GPU information (Windows only)
        #[cfg(windows)]
        let (gpu_model, gpu_temperature, gpu_usage, gpu_memory_used, gpu_memory_total) =
            if let Some(nvml) = &self.nvml {
                if let Ok(device) = nvml.device_by_index(0) {
                    let model = device.name().unwrap_or_else(|_| "Unknown".to_string());
                    let temp = device.temperature(TemperatureSensor::Gpu).unwrap_or(0) as f32;
                    let usage = device
                        .utilization_rates()
                        .map(|u| u.gpu as f32)
                        .unwrap_or(0.0);

                    // Get memory info without using MemoryInfo struct directly
                    let (memory_used, memory_total) = device
                        .memory_info()
                        .map(|mem| (mem.used, mem.total))
                        .unwrap_or((0, 0));

                    (
                        model,
                        temp,
                        usage,
                        memory_used / 1024 / 1024,  // Convert to MB
                        memory_total / 1024 / 1024, // Convert to MB
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

        SystemInfo {
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
        }
    }
}
