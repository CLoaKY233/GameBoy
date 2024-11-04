"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { invoke } from "@tauri-apps/api/core";

type SystemStats = {
  cpuModel: string;
  cpuUsage: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryAvailable: number;
  memoryUsage: number;
  gpuModel: string;
  gpuTemperature: number;
  gpuUsage: number;
  gpuMemoryUsed: number;
  gpuMemoryTotal: number;
  networkUpSpeed: number;
  networkDownSpeed: number;
  diskTotal: number;
  diskUsed: number;
  diskFree: number;
  diskUsage: number;
};

export default function WitchySystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const systemStats = await invoke<SystemStats>("get_system_stats");
        setStats(systemStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch system stats:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 500);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-800 text-purple-100 p-8 flex items-center justify-center">
        <div className="text-2xl">Loading system information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-800 text-purple-100 p-8 flex items-center justify-center">
        <div className="text-2xl text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-800 text-purple-100 p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800 via-black to-purple-900 animate-pulse opacity-50"></div>
      <div className="absolute inset-0 backdrop-blur-sm bg-black bg-opacity-30"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-200 tracking-wider">
          Witchy System Monitor
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries({
            CPU: { model: stats.cpuModel, usage: stats.cpuUsage },
            Memory: {
              total: formatBytes(stats.memoryTotal * 1024 * 1024),
              used: formatBytes(stats.memoryUsed * 1024 * 1024),
              available: formatBytes(stats.memoryAvailable * 1024 * 1024),
              usage: stats.memoryUsage,
            },
            GPU: {
              model: stats.gpuModel,
              usage: stats.gpuUsage,
              temp: `${stats.gpuTemperature}°C`,
              memory: `${formatBytes(stats.gpuMemoryUsed * 1024 * 1024)} / ${formatBytes(stats.gpuMemoryTotal * 1024 * 1024)}`,
            },
            Network: {
              Upload: `${stats.networkUpSpeed.toFixed(2)} MB/s`,
              Download: `${stats.networkDownSpeed.toFixed(2)} MB/s`,
            },
            Disk: {
              total: formatBytes(stats.diskTotal * 1024 * 1024 * 1024),
              used: formatBytes(stats.diskUsed * 1024 * 1024 * 1024),
              free: formatBytes(stats.diskFree * 1024 * 1024 * 1024),
              usage: stats.diskUsage,
            },
          }).map(([title, data]) => (
            <Card
              key={title}
              className="bg-purple-900 bg-opacity-30 backdrop-filter backdrop-blur-lg border border-purple-500 shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-purple-300">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <p className="text-sm text-purple-200 capitalize">
                      {key}:
                      <span className="ml-2 font-medium text-purple-100">
                        {typeof value === "number"
                          ? value.toFixed(1) + (key === "usage" ? "%" : "")
                          : value}
                      </span>
                    </p>
                    {key === "usage" && (
                      <Progress
                        value={value as number}
                        className="h-2 mt-1 bg-purple-800"
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
