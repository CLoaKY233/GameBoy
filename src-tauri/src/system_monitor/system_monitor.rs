use lazy_static::lazy_static;
#[cfg(windows)]
use nvml_wrapper::{enum_wrappers::device::TemperatureSensor, Nvml};
use parking_lot::Mutex;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
#[allow(unused_imports)]
use sysinfo::{CpuExt, DiskExt, NetworkExt, Networks, NetworksExt, System, SystemExt};
const CACHE_DURATION: Duration = Duration::from_millis(500);

lazy_static! {
    static ref SYSTEM: Arc<Mutex<System>> = Arc::new(Mutex::new(System::new_all()));
    static ref LAST_NETWORK_MEASURE: Mutex<Option<(Instant, u64, u64)>> = Mutex::new(None);
    static ref CACHED_INFO: Mutex<Option<(SystemInfo, Instant)>> = Mutex::new(None);
    #[cfg(windows)]
    static ref NVML: Mutex<Option<Nvml>> = Mutex::new(Nvml::init().ok());
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemInfo {
    #[serde(rename = "cpuModel")]
    pub cpu_model: String,
    #[serde(rename = "cpuUsage")]
    pub cpu_usage: f32,
    #[serde(rename = "memoryTotal")]
    pub memory_total: u32,
    #[serde(rename = "memoryUsed")]
    pub memory_used: u32,
    #[serde(rename = "memoryAvailable")]
    pub memory_available: u32,
    #[serde(rename = "memoryUsage")]
    pub memory_usage: f32,
    #[serde(rename = "gpuModel")]
    pub gpu_model: String,
    #[serde(rename = "gpuTemperature")]
    pub gpu_temperature: f32,
    #[serde(rename = "gpuUsage")]
    pub gpu_usage: f32,
    #[serde(rename = "gpuMemoryUsed")]
    pub gpu_memory_used: u32,
    #[serde(rename = "gpuMemoryTotal")]
    pub gpu_memory_total: u32,
    #[serde(rename = "networkUpSpeed")]
    pub network_up_speed: u32,
    #[serde(rename = "networkDownSpeed")]
    pub network_down_speed: u32,
    #[serde(rename = "diskTotal")]
    pub disk_total: u32,
    #[serde(rename = "diskUsed")]
    pub disk_used: u32,
    #[serde(rename = "diskFree")]
    pub disk_free: u32,
    #[serde(rename = "diskUsage")]
    pub disk_usage: f32,
}

#[tauri::command]
pub fn get_system_stats() -> Result<SystemInfo, String> {
    if let Some((info, timestamp)) = CACHED_INFO.lock().as_ref() {
        if timestamp.elapsed() < CACHE_DURATION {
            return Ok(info.clone());
        }
    }

    let mut sys = SYSTEM.lock();
    sys.refresh_all();

    // Using nested joins for more than 2 parallel tasks
    let ((cpu_stats, memory_stats), (disk_stats, (gpu_stats, network_stats))) = rayon::join(
        || rayon::join(|| get_cpu_stats(&sys), || get_memory_stats(&sys)),
        || {
            rayon::join(
                || get_disk_stats(&sys),
                || rayon::join(|| get_gpu_stats(), || get_network_stats(&sys)),
            )
        },
    );

    let info = SystemInfo {
        cpu_model: cpu_stats.0,
        cpu_usage: cpu_stats.1,
        memory_total: memory_stats.0,
        memory_used: memory_stats.1,
        memory_available: memory_stats.2,
        memory_usage: memory_stats.3,
        gpu_model: gpu_stats.0,
        gpu_temperature: gpu_stats.1,
        gpu_usage: gpu_stats.2,
        gpu_memory_used: gpu_stats.3,
        gpu_memory_total: gpu_stats.4,
        network_up_speed: network_stats.0,
        network_down_speed: network_stats.1,
        disk_total: disk_stats.0,
        disk_used: disk_stats.1,
        disk_free: disk_stats.2,
        disk_usage: disk_stats.3,
    };

    *CACHED_INFO.lock() = Some((info.clone(), Instant::now()));
    Ok(info)
}

fn get_cpu_stats(sys: &System) -> (String, f32) {
    let cpu_model = sys
        .cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let cpu_usage = sys
        .cpus()
        .par_iter()
        .map(|cpu| cpu.cpu_usage())
        .sum::<f32>()
        / sys.cpus().len() as f32;

    (cpu_model, cpu_usage)
}

fn get_memory_stats(sys: &System) -> (u32, u32, u32, f32) {
    let total = (sys.total_memory() / 1024 / 1024) as u32;
    let used = (sys.used_memory() / 1024 / 1024) as u32;
    let available = (sys.available_memory() / 1024 / 1024) as u32;
    let usage = (used as f32 / total as f32) * 100.0;

    (total, used, available, usage)
}

fn get_disk_stats(sys: &System) -> (u32, u32, u32, f32) {
    let total = AtomicU64::new(0);
    let free = AtomicU64::new(0);

    sys.disks().par_iter().for_each(|disk| {
        total.fetch_add(disk.total_space(), Ordering::Relaxed);
        free.fetch_add(disk.available_space(), Ordering::Relaxed);
    });

    let total_bytes = total.load(Ordering::Relaxed);
    let free_bytes = free.load(Ordering::Relaxed);
    let used_bytes = total_bytes.saturating_sub(free_bytes);

    let total_gb = (total_bytes / 1024 / 1024 / 1024) as u32;
    let used_gb = (used_bytes / 1024 / 1024 / 1024) as u32;
    let free_gb = (free_bytes / 1024 / 1024 / 1024) as u32;
    let usage = if total_gb > 0 {
        (used_gb as f32 / total_gb as f32) * 100.0
    } else {
        0.0
    };

    (total_gb, used_gb, free_gb, usage)
}

fn get_network_stats(sys: &System) -> (u32, u32) {
    let mut last_measure = LAST_NETWORK_MEASURE.lock();
    let now = Instant::now();

    let (current_rx, current_tx) = sys
        .networks()
        .into_iter() // Use into_iter() for Networks
        .fold((0u64, 0u64), |(rx, tx), (_name, data)| {
            (rx + data.received(), tx + data.transmitted())
        });

    let (down_speed, up_speed) = if let Some((last_time, last_rx, last_tx)) = *last_measure {
        let duration = now.duration_since(last_time).as_secs_f64();
        if duration > 0.0 {
            let down = ((current_rx.saturating_sub(last_rx)) as f64 / duration / 1024.0) as u32;
            let up = ((current_tx.saturating_sub(last_tx)) as f64 / duration / 1024.0) as u32;
            (down, up)
        } else {
            (0, 0)
        }
    } else {
        (0, 0)
    };

    *last_measure = Some((now, current_rx, current_tx));
    (down_speed, up_speed)
}

#[cfg(windows)]
fn get_gpu_stats() -> (String, f32, f32, u32, u32) {
    if let Some(nvml) = &*NVML.lock() {
        if let Ok(device) = nvml.device_by_index(0) {
            return (
                device.name().unwrap_or_else(|_| "Unknown".to_string()),
                device
                    .temperature(TemperatureSensor::Gpu)
                    .map(|t| t as f32)
                    .unwrap_or(0.0),
                device
                    .utilization_rates()
                    .map(|u| u.gpu as f32)
                    .unwrap_or(0.0),
                (device
                    .memory_info()
                    .map(|m| m.used / 1024 / 1024)
                    .unwrap_or(0)) as u32,
                (device
                    .memory_info()
                    .map(|m| m.total / 1024 / 1024)
                    .unwrap_or(0)) as u32,
            );
        }
    }
    ("No NVIDIA GPU detected".to_string(), 0.0, 0.0, 0, 0)
}

#[cfg(not(windows))]
fn get_gpu_stats() -> (String, f32, f32, u32, u32) {
    ("N/A".to_string(), 0.0, 0.0, 0, 0)
}
