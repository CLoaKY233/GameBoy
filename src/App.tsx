import "./App.css";
("use client");
import Statemanager from "./components/TheStatemanager";
import Systemstats from "./components/Systemstats";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  NavLink,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Skull, Flame, BookOpen } from "lucide-react";

const MagicalBackground = () => (
  <div className="fixed inset-0 z-0">
    <div className="absolute inset-0 bg-black">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-900 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: Math.random(),
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  </div>
);

const MagicalCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (e: MouseEvent) =>
      setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", updatePosition);
    return () => window.removeEventListener("mousemove", updatePosition);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference"
      animate={{ x: position.x - 10, y: position.y - 10 }}
      transition={{ type: "spring", damping: 3, stiffness: 50 }}
    >
      <div className="w-5 h-5 bg-purple-700 rounded-full opacity-50" />
      <motion.div
        className="absolute top-0 left-0 w-5 h-5 bg-purple-400 rounded-full"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  );
};

const Sidebar = () => {
  const navItems = [
    { path: "/systemstats", name: "Arcane Stats", icon: <Skull size={20} /> },
    {
      path: "/powermanager",
      name: "Eldritch Energy",
      icon: <Flame size={20} />,
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-purple-900/20 backdrop-blur-sm border-r border-purple-800/50">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-purple-300 flex items-center">
          <BookOpen className="mr-2" />
          Grimoire
        </h1>
      </div>
      <nav className="mt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? "bg-purple-800/30 text-purple-200 border-l-4 border-purple-400"
                  : "text-purple-400 hover:bg-purple-800/20 hover:text-purple-200"
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

const Header = () => {
  const [time, setTime] = useState(new Date());
  const [moonPhase, setMoonPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const phase = Math.floor((time.getTime() / (24 * 3600 * 1000)) % 8);
    setMoonPhase(phase);
  }, [time]);

  return (
    <div className="flex justify-between items-center mb-6 bg-purple-900/20 p-4 rounded-lg backdrop-blur-sm">
      <h2 className="text-xl font-semibold text-purple-300">
        Grimoire Witchcraft Dashboard
      </h2>
      <div className="flex items-center gap-4 text-purple-300">
        <span>{time.toLocaleTimeString()}</span>
        {moonPhase < 4 ? (
          <Moon className="text-purple-300" />
        ) : (
          <Sun className="text-purple-300" />
        )}
      </div>
    </div>
  );
};

const LoadingAnimation = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
    <motion.div
      className="text-purple-500 text-6xl"
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 360],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.5, 1],
        repeat: Infinity,
      }}
    >
      ✦
    </motion.div>
  </div>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-black text-purple-300 relative overflow-hidden">
        <MagicalBackground />
        <MagicalCursor />

        <AnimatePresence>
          {isLoading ? (
            <LoadingAnimation key="loading" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex"
            >
              <Sidebar />
              <main className="flex-1 ml-64 p-8">
                <Header />
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="bg-purple-900/10 backdrop-blur-sm rounded-lg p-6 border border-purple-800/30"
                >
                  <Routes>
                    <Route path="/systemstats" element={<Systemstats />} />
                    <Route path="/powermanager" element={<Statemanager />} />
                  </Routes>
                </motion.div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
};

export default App;
