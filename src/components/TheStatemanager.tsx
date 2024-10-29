"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Zap,
  Battery,
  CheckCircle,
  XCircle,
  RotateCcw,
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

export default function Component() {
  const [boostMode, setBoostMode] = useState<number>(initialState.boostMode);
  const [maxProcessorState, setMaxProcessorState] = useState<number>(
    initialState.maxProcessorState,
  );
  const [powerMode, setPowerMode] = useState<PowerMode>(initialState.powerMode);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [heartbeatScale, setHeartbeatScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeatScale((scale) => (scale === 1 ? 1.1 : 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (submissionResult) {
      const timer = setTimeout(() => {
        setSubmissionResult(null);
      }, 3000); // Message will disappear after 3 seconds

      // Cleanup the timeout if the component unmounts or submissionResult changes
      return () => clearTimeout(timer);
    }
  }, [submissionResult]);

  const handleSubmit = async () => {
    setIsOptimizing(true);
    try {
      const result = await invoke("switcher", {
        alpha: boostMode.toString(),
        beta: maxProcessorState.toString(),
        gamma: powerMode.toLowerCase(),
      });

      // Check if the result contains error keywords
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
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-purple-900/20 rounded-full filter blur-3xl"
        animate={{ scale: heartbeatScale }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <header className="bg-black/50 backdrop-blur-md p-4 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            Boostify V1.0
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-400 hover:text-white transition-colors"
          ></motion.button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-8 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl bg-black/50 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-purple-500/20"
        >
          <div className="p-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label className="text-sm text-gray-400 flex items-center mb-2">
                <Cpu className="mr-2" size={18} />
                Boost Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {boostModes.map((mode) => (
                  <motion.button
                    key={mode.value}
                    className={`p-2 rounded-md flex items-center justify-center text-sm ${
                      boostMode === mode.value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                    whileHover={{ scale: 1.05, backgroundColor: "#4C1D95" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBoostMode(mode.value)}
                  >
                    {mode.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label className="text-sm text-gray-400 flex items-center mb-2">
                <Zap className="mr-2" size={18} />
                Max Processor State: {maxProcessorState}%
              </label>
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
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
                  onChange={(e) => setMaxProcessorState(Number(e.target.value))}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-between"
            >
              <label className="text-sm text-gray-400 flex items-center">
                <Battery className="mr-2" size={18} />
                Power Mode: {powerMode}
              </label>
              <motion.button
                className={`w-12 h-6 rounded-full flex items-center ${
                  powerMode === "AC"
                    ? "bg-purple-600 justify-end"
                    : "bg-gray-700 justify-start"
                }`}
                onClick={() => setPowerMode(powerMode === "AC" ? "DC" : "AC")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                  layout
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              </motion.button>
            </motion.div>

            <div className="flex space-x-4">
              <motion.button
                className="flex-1 p-3 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg shadow-lg"
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
                  "BOOST"
                )}
              </motion.button>
              <motion.button
                className="p-3 rounded-md bg-gray-700 text-white font-bold text-lg shadow-lg"
                whileHover={{ scale: 1.05, backgroundColor: "#374151" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
              >
                <RotateCcw size={24} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {submissionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-4 right-4 p-4 rounded-xl z-30 ${
              submissionResult.status === "success"
                ? "bg-green-800/80"
                : "bg-red-800/80"
            } border ${
              submissionResult.status === "success"
                ? "border-green-400"
                : "border-red-600"
            } backdrop-blur-md`}
          >
            <div className="flex items-center">
              {submissionResult.status === "success" ? (
                <CheckCircle className="mr-2 text-green-400" size={20} />
              ) : (
                <XCircle className="mr-2 text-red-400" size={20} />
              )}
              <span
                className={`text-sm font-medium ${
                  submissionResult.status === "success"
                    ? "text-green-100"
                    : "text-red-100"
                }`}
              >
                {submissionResult.status === "success"
                  ? "Optimization Successful"
                  : "Optimization Failed"}
              </span>
            </div>
            <pre
              className={`mt-1 text-xs whitespace-pre-line ${
                submissionResult.status === "success"
                  ? "text-green-200"
                  : "text-red-200"
              }`}
            >
              {submissionResult.message}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
