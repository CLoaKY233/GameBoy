"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { invoke } from "@tauri-apps/api/core";
import { Cpu, MemoryStick, HardDrive, Wifi, Thermometer } from "lucide-react";

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

export default function Component() {
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
    const interval = setInterval(fetchStats, 1000);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-2xl text-purple-400"
        >
          Summoning system information...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-2xl text-red-400"
        >
          A dark force intervenes: {error}
        </motion.div>
      </div>
    );
  }

  const statCards = [
    {
      title: "CPU",
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      data: [
        { label: "Model", value: stats.cpuModel },
        {
          label: "Usage",
          value: `${stats.cpuUsage.toFixed(1)}%`,
          progress: stats.cpuUsage,
        },
      ],
    },
    {
      title: "Memory",
      icon: <MemoryStick className="w-6 h-6 text-purple-400" />,
      data: [
        { label: "Total", value: formatBytes(stats.memoryTotal * 1024 * 1024) },
        { label: "Used", value: formatBytes(stats.memoryUsed * 1024 * 1024) },
        {
          label: "Available",
          value: formatBytes(stats.memoryAvailable * 1024 * 1024),
        },
        {
          label: "Usage",
          value: `${stats.memoryUsage.toFixed(1)}%`,
          progress: stats.memoryUsage,
        },
      ],
    },
    {
      title: "GPU",
      icon: <Thermometer className="w-6 h-6 text-purple-400" />,
      data: [
        { label: "Model", value: stats.gpuModel },
        { label: "Temperature", value: `${stats.gpuTemperature.toFixed(1)}°C` },
        {
          label: "Usage",
          value: `${stats.gpuUsage.toFixed(1)}%`,
          progress: stats.gpuUsage,
        },
        {
          label: "Memory",
          value: `${formatBytes(stats.gpuMemoryUsed * 1024 * 1024)} / ${formatBytes(stats.gpuMemoryTotal * 1024 * 1024)}`,
        },
      ],
    },
    {
      title: "Network",
      icon: <Wifi className="w-6 h-6 text-purple-400" />,
      data: [
        { label: "Upload", value: `${stats.networkUpSpeed.toFixed(2)} MB/s` },
        {
          label: "Download",
          value: `${stats.networkDownSpeed.toFixed(2)} MB/s`,
        },
      ],
    },
    {
      title: "Disk",
      icon: <HardDrive className="w-6 h-6 text-purple-400" />,
      data: [
        {
          label: "Total",
          value: formatBytes(stats.diskTotal * 1024 * 1024 * 1024),
        },
        {
          label: "Used",
          value: formatBytes(stats.diskUsed * 1024 * 1024 * 1024),
        },
        {
          label: "Free",
          value: formatBytes(stats.diskFree * 1024 * 1024 * 1024),
        },
        {
          label: "Usage",
          value: `${stats.diskUsage.toFixed(1)}%`,
          progress: stats.diskUsage,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black text-purple-100 p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/magic-bg.jpg')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-purple-800/20 animate-pulse" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-center text-purple-200 tracking-wider"
        >
          Grimoire System Monitor
        </motion.h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {statCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="bg-purple-900/30 backdrop-blur-md border-purple-500/50 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-semibold text-purple-300">
                      {card.title}
                    </CardTitle>
                    {card.icon}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {card.data.map((item, i) => (
                      <div key={i} className="mb-2">
                        <p className="text-sm text-purple-200 flex justify-between items-center">
                          <span>{item.label}:</span>
                          <span className="font-medium text-purple-100">
                            {item.value}
                          </span>
                        </p>
                        {item.progress !== undefined && (
                          <Progress
                            value={item.progress}
                            className="h-1 mt-1 bg-purple-800"
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
