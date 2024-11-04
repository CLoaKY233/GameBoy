"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Thermometer,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

export default function GrimoireSystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const systemStats = await invoke<SystemStats>("get_system_stats");
      setStats(systemStats);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch system stats:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
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

  const ExpandableText = ({
    text,
    maxLength = 20,
  }: {
    text: string;
    maxLength?: number;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > maxLength;
    const displayText =
      isExpanded || !shouldTruncate ? text : text.slice(0, maxLength) + "...";

    return (
      <div className="flex items-center">
        <span className="mr-1">{displayText}</span>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300 focus:outline-none"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
    );
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
        { label: "Model", value: <ExpandableText text={stats.cpuModel} /> },
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
        { label: "Model", value: <ExpandableText text={stats.gpuModel} /> },
        { label: "Temperature", value: `${stats.gpuTemperature.toFixed(1)}°C` },
        {
          label: "Usage",
          value: `${stats.gpuUsage.toFixed(1)}%`,
          progress: stats.gpuUsage,
        },
        {
          label: "Memory",
          value: (
            <ExpandableText
              text={`${formatBytes(stats.gpuMemoryUsed * 1024 * 1024)} / ${formatBytes(stats.gpuMemoryTotal * 1024 * 1024)}`}
            />
          ),
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
      <div className="absolute inset-0 bg-[url('/magic-bg.jpg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-black to-purple-950/10 animate-pulse" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-4xl font-bold text-purple-200 tracking-wider">
            Grimoire System Monitor
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center"
            onClick={fetchStats}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-5 h-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </motion.button>
        </motion.div>
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
                <Card className="bg-purple-950/20 backdrop-blur-sm border-purple-800/30 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-semibold text-purple-300">
                      {card.title}
                    </CardTitle>
                    {card.icon}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {card.data.map((item, i) => (
                      <div key={i} className="mb-4">
                        <p className="text-sm text-purple-200 flex justify-between items-center mb-1">
                          <span>{item.label}:</span>
                          <span className="font-medium text-purple-100">
                            {item.value}
                          </span>
                        </p>
                        {item.progress !== undefined && (
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-purple-200/20">
                              <motion.div
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <motion.div
                              className="absolute top-0 left-0 w-full h-full bg-purple-400/30 blur-sm rounded"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
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
