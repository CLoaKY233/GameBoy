"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Monitor, Thermometer, Activity, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { invoke } from "@tauri-apps/api/core";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SystemInfo {
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
}

export default function Component() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        console.log("Fetching system stats...");
        const stats = await invoke<SystemInfo>("get_system_stats");
        console.log("Raw stats received:", JSON.stringify(stats, null, 2));

        if (!stats) {
          throw new Error("No data received from system");
        }

        // Log each field for debugging
        console.log("CPU Model:", stats.cpuModel);
        console.log("CPU Usage:", stats.cpuUsage);
        console.log("Memory Total:", stats.memoryTotal);
        console.log("Memory Used:", stats.memoryUsed);
        console.log("Memory Available:", stats.memoryAvailable);
        console.log("Memory Usage:", stats.memoryUsage);
        console.log("GPU Model:", stats.gpuModel);
        console.log("GPU Temperature:", stats.gpuTemperature);
        console.log("GPU Usage:", stats.gpuUsage);
        console.log("GPU Memory Used:", stats.gpuMemoryUsed);
        console.log("GPU Memory Total:", stats.gpuMemoryTotal);

        setSystemInfo(stats);
        setError(null);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!systemInfo && process.env.NODE_ENV === "development") {
    setSystemInfo({
      cpuModel: "Development CPU",
      cpuUsage: 50,
      memoryTotal: 16384,
      memoryUsed: 8192,
      memoryAvailable: 8192,
      memoryUsage: 50,
      gpuModel: "Development GPU",
      gpuTemperature: 60,
      gpuUsage: 30,
      gpuMemoryUsed: 2048,
      gpuMemoryTotal: 8192,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-purple-400">Loading system information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-red-400">
          Error loading system information: {error}
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-red-400">No system information available</div>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: (value: number) => ({
      width: `${value}%`,
      transition: { duration: 0.5, ease: "easeInOut" },
    }),
  };

  const glowVariants = {
    idle: { opacity: 0.5, scale: 1 },
    active: {
      opacity: 1,
      scale: 1.2,
      transition: { duration: 0.5, yoyo: Infinity },
    },
  };

  const renderCard = (
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
  ) => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setActiveCard(title)}
      onHoverEnd={() => setActiveCard(null)}
      className="relative"
    >
      <Card className="bg-gray-900 border-purple-500/20 overflow-hidden backdrop-blur-sm bg-opacity-80">
        <CardContent className="p-6">
          <motion.div
            className="absolute inset-0 bg-purple-500 rounded-lg filter blur-xl"
            variants={glowVariants}
            animate={activeCard === title ? "active" : "idle"}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="mr-2">{icon}</span>
                <span>{title}</span>
              </h3>
              <motion.div
                animate={{ rotate: activeCard === title ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Activity className="text-purple-400" />
              </motion.div>
            </div>
            {content}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <TooltipProvider>
      <div className="p-8 bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent text-white min-h-screen">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
        >
          Quantum Boost - System Monitor
        </motion.h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderCard(
            "CPU",
            <Cpu className="text-blue-400" />,
            <>
              <p className="text-sm mb-2 text-gray-300">
                {systemInfo?.cpuModel || "N/A"}
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Usage</span>
                <span className="font-semibold">
                  {typeof systemInfo?.cpuUsage === "number"
                    ? systemInfo.cpuUsage.toFixed(1)
                    : "N/A"}
                  %
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <motion.div
                    variants={progressVariants}
                    initial="hidden"
                    animate="visible"
                    custom={systemInfo?.cpuUsage || 0}
                    className="bg-blue-900/30 h-2 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${systemInfo?.cpuUsage || 0}%` }}
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    CPU Usage:{" "}
                    {typeof systemInfo?.cpuUsage === "number"
                      ? systemInfo.cpuUsage.toFixed(1)
                      : "N/A"}
                    %
                  </p>
                </TooltipContent>
              </Tooltip>
            </>,
          )}

          {renderCard(
            "Memory",
            <Monitor className="text-red-400" />,
            <>
              <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total</span>
                  <span>{systemInfo?.memoryTotal || "N/A"} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Used</span>
                  <span>{systemInfo?.memoryUsed || "N/A"} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Available</span>
                  <span>{systemInfo?.memoryAvailable || "N/A"} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Usage</span>
                  <span>
                    {typeof systemInfo?.memoryUsage === "number"
                      ? systemInfo.memoryUsage.toFixed(1)
                      : "N/A"}
                    %
                  </span>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger className="w-full">
                  <motion.div
                    variants={progressVariants}
                    initial="hidden"
                    animate="visible"
                    custom={systemInfo.memoryUsage}
                    className="bg-green-900/30 h-2 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600"
                      style={{ width: `${systemInfo.memoryUsage}%` }}
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Memory Usage: {systemInfo.memoryUsage.toFixed(1)}%</p>
                </TooltipContent>
              </Tooltip>
            </>,
          )}

          {renderCard(
            "GPU",
            <Monitor className="text-red-400" />,
            <>
              <p className="text-sm mb-2 text-gray-300">
                {systemInfo?.gpuModel || "N/A"}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="flex items-center">
                  <Thermometer className="mr-2 text-orange-400" size={16} />
                  <span className="text-gray-300">Temp</span>
                </div>
                <span className="text-right">
                  {typeof systemInfo?.gpuTemperature === "number"
                    ? systemInfo.gpuTemperature.toFixed(1)
                    : "N/A"}
                  °C
                </span>
                <div className="flex items-center">
                  <Zap className="mr-2 text-yellow-400" size={16} />
                  <span className="text-gray-300">Usage</span>
                </div>
                <span className="text-right">
                  {typeof systemInfo?.gpuUsage === "number"
                    ? systemInfo.gpuUsage.toFixed(1)
                    : "N/A"}
                  %
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <motion.div
                    variants={progressVariants}
                    initial="hidden"
                    animate="visible"
                    custom={systemInfo.gpuUsage}
                    className="bg-red-900/30 h-2 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-600"
                      style={{ width: `${systemInfo.gpuUsage}%` }}
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>GPU Usage: {systemInfo.gpuUsage.toFixed(1)}%</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-300">Memory</span>
                <span>
                  {systemInfo.gpuMemoryUsed}/{systemInfo.gpuMemoryTotal} MB
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <motion.div
                    variants={progressVariants}
                    initial="hidden"
                    animate="visible"
                    custom={
                      (systemInfo.gpuMemoryUsed / systemInfo.gpuMemoryTotal) *
                      100
                    }
                    className="bg-purple-900/30 h-2 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                      style={{
                        width: `${(systemInfo.gpuMemoryUsed / systemInfo.gpuMemoryTotal) * 100}%`,
                      }}
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    GPU Memory: {systemInfo.gpuMemoryUsed}/
                    {systemInfo.gpuMemoryTotal} MB (
                    {(
                      (systemInfo.gpuMemoryUsed / systemInfo.gpuMemoryTotal) *
                      100
                    ).toFixed(1)}
                    %)
                  </p>
                </TooltipContent>
              </Tooltip>
            </>,
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
