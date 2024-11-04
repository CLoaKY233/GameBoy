use lazy_static::lazy_static;
#[cfg(windows)]
use nvml_wrapper::{enum_wrappers::device::TemperatureSensor, Nvml};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::Instant;
use sysinfo::{CpuExt, DiskExt, NetworkExt, System, SystemExt};

lazy_static! {
    static ref LAST_NETWORK_MEASURE: Mutex<Option<(Instant, u64, u64)>> = Mutex::new(None);
}

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
    #[serde(rename = "networkUpSpeed")]
    pub network_up_speed: u64,
    #[serde(rename = "networkDownSpeed")]
    pub network_down_speed: u64,
    #[serde(rename = "diskTotal")]
    pub disk_total: u64,
    #[serde(rename = "diskUsed")]
    pub disk_used: u64,
    #[serde(rename = "diskFree")]
    pub disk_free: u64,
    #[serde(rename = "diskUsage")]
    pub disk_usage: f32,
}

#[tauri::command]
pub fn get_system_stats() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    sys.refresh_networks_list();
    sys.refresh_networks();
    sys.refresh_disks();

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
    #[allow(unused_assignments)]
    let (mut total_space, mut used_space, mut free_space) = (0, 0, 0);
    for disk in sys.disks() {
        total_space += disk.total_space();
        free_space += disk.available_space();
    }
    used_space = total_space - free_space;

    let disk_total = total_space / 1024 / 1024 / 1024;
    let disk_used = used_space / 1024 / 1024 / 1024;
    let disk_free = free_space / 1024 / 1024 / 1024;
    let disk_usage = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    // Network speed calculation
    // Network speed calculation
    let (network_down_speed, network_up_speed) = {
        let mut last_measure = LAST_NETWORK_MEASURE.lock().unwrap();
        let now = Instant::now();

        let mut current_rx = 0u64;
        let mut current_tx = 0u64;

        // Get current network stats
        for (_, data) in sys.networks() {
            current_rx += data.received();
            current_tx += data.transmitted();
        }

        // Calculate speeds with higher precision
        let (down_speed, up_speed) = if let Some((last_time, last_rx, last_tx)) = *last_measure {
            let duration = now.duration_since(last_time).as_secs_f64();
            if duration > 0.0 {
                // Calculate bytes per second first
                let down_bps = (current_rx.saturating_sub(last_rx)) as f64 / duration;
                let up_bps = (current_tx.saturating_sub(last_tx)) as f64 / duration;

                // Convert to KB/s with higher precision
                (down_bps / 1024.0, up_bps / 1024.0)
            } else {
                (0.0, 0.0)
            }
        } else {
            (0.0, 0.0)
        };

        // Update last measure
        *last_measure = Some((now, current_rx, current_tx));

        // Debug prints with more detailed information
        // println!("Timestamp: {:?}", now.elapsed());
        // println!("Network Stats:");
        // println!(
        //     "  RX: {} bytes ({})",
        //     current_rx,
        //     if current_rx >= 1024 * 1024 {
        //         format!("{:.2} MB", current_rx as f64 / 1024.0 / 1024.0)
        //     } else {
        //         format!("{:.2} KB", current_rx as f64 / 1024.0)
        //     }
        // );
        // println!(
        //     "  TX: {} bytes ({})",
        //     current_tx,
        //     if current_tx >= 1024 * 1024 {
        //         format!("{:.2} MB", current_tx as f64 / 1024.0 / 1024.0)
        //     } else {
        //         format!("{:.2} KB", current_tx as f64 / 1024.0)
        //     }
        // );
        // println!("Speeds:");
        // println!(
        //     "  Download: {:.2} KB/s ({:.2} MB/s)",
        //     down_speed,
        //     down_speed / 1024.0
        // );
        // println!(
        //     "  Upload: {:.2} KB/s ({:.2} MB/s)",
        //     up_speed,
        //     up_speed / 1024.0
        // );

        // Return speeds in KB/s
        (down_speed as u64, up_speed as u64)
    };

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
        network_up_speed,
        network_down_speed,
        disk_total,
        disk_used,
        disk_free,
        disk_usage,
    })
}
