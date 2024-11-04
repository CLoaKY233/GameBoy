"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { listen } from "@tauri-apps/api/event";
import {
  Cpu,
  Zap,
  Battery,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

type PowerMode = "AC" | "DC";

interface SubmissionResult {
  status: "success" | "error";
  message: string;
}

const boostModes = [
  { value: 0, label: "Disabled" },
  { value: 1, label: "Enabled" },
  { value: 2, label: "Aggressive" },
  { value: 3, label: "Efficient Enabled" },
  { value: 4, label: "Efficient Aggressive" },
  { value: 5, label: "Aggressive At Guaranteed" },
  { value: 6, label: "Efficient Aggressive At Guaranteed" },
];

const initialState = {
  boostMode: 0,
  maxProcessorState: 95,
  powerMode: "AC" as PowerMode,
};

export default function WitchySystemOptimizer() {
  const [boostMode, setBoostMode] = useState<number>(initialState.boostMode);
  const [maxProcessorState, setMaxProcessorState] = useState<number>(
    initialState.maxProcessorState,
  );
  const [currentBoostMode, setCurrentBoostMode] = useState<number>(
    initialState.boostMode,
  );
  const [currentProcessorState, setCurrentProcessorState] = useState<number>(
    initialState.maxProcessorState,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [powerMode, setPowerMode] = useState<PowerMode>(initialState.powerMode);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fetchCurrentSettings = async () => {
    try {
      const settings = await invoke("get_current_settings");
      if (typeof settings === "object") {
        const settingsMap = settings as Record<string, number>;

        // Update states based on power mode
        if (powerMode === "AC") {
          setCurrentBoostMode(
            settingsMap.acBoostMode ?? initialState.boostMode,
          );
          setCurrentProcessorState(
            settingsMap.acMaxProcessorState ?? initialState.maxProcessorState,
          );
        } else {
          setCurrentBoostMode(
            settingsMap.dcBoostMode ?? initialState.boostMode,
          );
          setCurrentProcessorState(
            settingsMap.dcMaxProcessorState ?? initialState.maxProcessorState,
          );
        }
      }
    } catch (error) {
      setSubmissionResult({
        status: "error",
        message: `Failed to fetch current settings: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (submissionResult) {
      const timer = setTimeout(() => {
        setSubmissionResult(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submissionResult]);

  useEffect(() => {
    // Initial fetch when component mounts
    fetchCurrentSettings();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    fetchCurrentSettings();
  }, [powerMode]);

  useEffect(() => {
    if (submissionResult?.status === "success") {
      fetchCurrentSettings();
    }
  }, [submissionResult]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-purple-100 p-8 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('/magic-bg.jpg')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-purple-800/20 animate-pulse" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsOptimizing(true);
    try {
      const result = await invoke("switcher", {
        boostMode: boostMode.toString(),
        maxProcessorState: maxProcessorState.toString(),
        powerType: powerMode.toLowerCase(),
      });

      const resultStr = result as string;
      if (resultStr.toLowerCase().includes("error")) {
        setSubmissionResult({
          status: "error",
          message: resultStr,
        });
      } else {
        setSubmissionResult({
          status: "success",
          message: resultStr,
        });
      }
    } catch (error) {
      setSubmissionResult({
        status: "error",
        message: `Error: ${error}`,
      });
    }
    setIsOptimizing(false);
  };

  const handleReset = () => {
    setBoostMode(initialState.boostMode);
    setMaxProcessorState(initialState.maxProcessorState);
    setPowerMode(initialState.powerMode);
    setSubmissionResult(null);
  };

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
          Grimoire System Optimizer
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-purple-900/30 backdrop-blur-md border-purple-500/50 shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-purple-300">
                    Boost Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm text-purple-300 flex items-center mb-2">
                      <Cpu className="mr-2" size={18} />
                      Boost Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {boostModes.map((mode) => (
                        <motion.button
                          key={mode.value}
                          className={`p-2 rounded-xl flex items-center justify-center text-sm ${
                            boostMode === mode.value
                              ? "bg-purple-600 text-white"
                              : "bg-purple-900/50 text-purple-300"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBoostMode(mode.value)}
                        >
                          {mode.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-purple-300 flex items-center mb-2">
                      <Zap className="mr-2" size={18} />
                      Max Processor State: {maxProcessorState}%
                    </label>
                    <div className="relative h-2 bg-purple-900/50 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-blue-600"
                        style={{ width: `${maxProcessorState}%` }}
                        layout
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={maxProcessorState}
                        onChange={(e) =>
                          setMaxProcessorState(Number(e.target.value))
                        }
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-purple-300 flex items-center">
                      <Battery className="mr-2" size={18} />
                      Power Mode: {powerMode}
                    </label>
                    <motion.button
                      className={`w-16 h-8 rounded-full flex items-center ${
                        powerMode === "AC"
                          ? "bg-purple-600 justify-end"
                          : "bg-purple-900/50 justify-start"
                      }`}
                      onClick={() =>
                        setPowerMode(powerMode === "AC" ? "DC" : "AC")
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        {powerMode === "AC" ? (
                          <Zap className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Battery className="w-4 h-4 text-purple-900" />
                        )}
                      </motion.div>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-purple-900/30 backdrop-blur-md border-purple-500/50 shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-purple-300">
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-purple-900/50">
                    <p className="text-lg font-medium text-purple-300">
                      Current Boost Mode:{" "}
                      {
                        boostModes.find(
                          (mode) => mode.value === currentBoostMode,
                        )?.label
                      }
                    </p>
                    {currentBoostMode !== boostMode && (
                      <p className="text-sm text-purple-400 mt-1">
                        → Changing to:{" "}
                        {
                          boostModes.find((mode) => mode.value === boostMode)
                            ?.label
                        }
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-purple-900/50">
                    <p className="text-lg font-medium text-purple-300">
                      Current Max Processor State: {currentProcessorState}%
                    </p>
                    {currentProcessorState !== maxProcessorState && (
                      <p className="text-sm text-purple-400 mt-1">
                        → Changing to: {maxProcessorState}%
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-purple-900/50">
                    <p className="text-lg font-medium text-purple-300">
                      Power Mode: {powerMode}
                    </p>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <motion.button
                      className="flex-1 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg shadow-lg"
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 0 20px rgba(167, 139, 250, 0.4)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={isOptimizing}
                    >
                      {isOptimizing ? (
                        <motion.div
                          className="w-6 h-6 border-3 border-white border-t-transparent rounded-full mx-auto"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      ) : (
                        <span className="flex items-center justify-center">
                          <Sparkles className="mr-2" size={20} />
                          Cast Optimization Spell
                        </span>
                      )}
                    </motion.button>
                    <motion.button
                      className="p-4 rounded-xl bg-purple-900/50 text-purple-300 font-bold text-lg shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                    >
                      <RotateCcw size={24} />
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {submissionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-8 right-8 p-6 rounded-xl z-30 ${
              submissionResult.status === "success"
                ? "bg-green-800/80"
                : "bg-red-800/80"
            } border ${
              submissionResult.status === "success"
                ? "border-green-400"
                : "border-red-400"
            } backdrop-blur-md shadow-lg`}
          >
            <div className="flex items-center">
              {submissionResult.status === "success" ? (
                <CheckCircle className="mr-3 text-green-400" size={24} />
              ) : (
                <XCircle className="mr-3 text-red-400" size={24} />
              )}
              <span className="text-lg font-medium text-white">
                {submissionResult.status === "success"
                  ? "Optimization Spell Cast Successfully"
                  : "Optimization Spell Fizzled"}
              </span>
            </div>
            <p
              className={`mt-2 text-sm ${
                submissionResult.status === "success"
                  ? "text-green-200"
                  : "text-red-200"
              }`}
            >
              {submissionResult.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
