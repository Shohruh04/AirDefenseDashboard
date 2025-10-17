import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import { useSimulation } from "./lib/stores/useSimulation";
import { useSettings } from "./lib/stores/useSettings";

function App() {
  const { startSimulation, stopSimulation } = useSimulation();
  const { isSimulationRunning } = useSettings();

  useEffect(() => {
    // Auto-start simulation when app loads
    if (isSimulationRunning) {
      startSimulation();
    }

    // Cleanup on unmount
    return () => {
      stopSimulation();
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <div className="w-full h-full bg-background text-foreground">
          <Layout />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
