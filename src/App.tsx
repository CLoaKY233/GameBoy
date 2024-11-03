"use client";

// src/App.tsx

import "./App.css";
("use client");

import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  NavLink,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LayoutDashboard, Zap } from "lucide-react";
import Statemanager from "./components/TheStatemanager";
import Systemstats from "./components/Systemstats";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error | undefined }) {
  return (
    <Card className="bg-red-900/20 border-red-500">
      <CardContent className="p-4">
        <h2 className="text-xl font-bold text-red-500 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-red-400 mb-4">
          Error: {error?.message || "An unknown error occurred"}
        </p>
        <Button variant="destructive" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </CardContent>
    </Card>
  );
}

const PulsatingBackground: React.FC = () => (
  <div className="fixed inset-0 z-0">
    <motion.div
      className="absolute inset-0 bg-purple-900/20"
      animate={{
        opacity: [0.2, 0.3, 0.2],
      }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    />
  </div>
);

const VerticalNavbar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      path: "/systemstats",
      name: "System Stats",
      icon: <LayoutDashboard size={20} />,
    },
    { path: "/powermanager", name: "Power Manager", icon: <Zap size={20} /> },
    // Add more nav items here as needed
  ];

  return (
    <motion.div
      className="fixed left-0 top-0 h-full bg-purple-900/30 backdrop-blur-md z-50 flex flex-col"
      initial={{ width: 240 }}
      animate={{ width: isCollapsed ? 80 : 240 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 flex items-center justify-between">
        <h1
          className={`text-2xl font-bold text-purple-400 ${isCollapsed ? "hidden" : "block"}`}
        >
          Wraith
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-purple-400 hover:text-purple-300"
        >
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </Button>
      </div>
      <nav className="flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 text-sm ${
                isActive
                  ? "bg-purple-700/50 text-white"
                  : "text-gray-300 hover:bg-purple-700/30 hover:text-white"
              }`
            }
          >
            {item.icon}
            <span className={isCollapsed ? "hidden" : "block"}>
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>
    </motion.div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <div className="min-h-screen bg-[#0a0a0f] text-gray-100 relative overflow-hidden">
          <PulsatingBackground />
          <VerticalNavbar />

          <main className="pt-8 pl-[88px] pr-8 transition-all duration-300">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6">
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="/systemstats" replace />}
                  />
                  <Route path="/systemstats" element={<Systemstats />} />
                  <Route path="/powermanager" element={<Statemanager />} />
                  {/* Add more routes here as needed */}
                </Routes>
              </CardContent>
            </Card>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
