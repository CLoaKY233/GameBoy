// src/App.tsx
import React, { useState } from "react";
import Statemanager from "./components/TheStatemanager";
import Systemstats from "./components/Systemstats";
import "./App.css";

import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-red-500 p-4">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<"statemanager" | "systemstats">(
    "statemanager",
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="min-h-screen bg-[#0a0a0f]">
          <nav className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-md p-4 z-50">
            <div className="container mx-auto flex justify-center gap-4">
              <button
                onClick={() => setActiveView("statemanager")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeView === "statemanager"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Power Manager
              </button>
              <button
                onClick={() => setActiveView("systemstats")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeView === "systemstats"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                System Stats
              </button>
            </div>
          </nav>

          <div className="pt-20">
            {activeView === "statemanager" && <Statemanager />}
            {activeView === "systemstats" && <Systemstats />}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
