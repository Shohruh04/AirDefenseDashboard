import { useEffect, useRef } from "react";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import { useSimulation } from "./lib/stores/useSimulation";
import { useSettings } from "./lib/stores/useSettings";

function App() {
  const { startSimulation, stopSimulation } = useSimulation();
  const { isSimulationRunning } = useSettings();
  const prevRunning = useRef(isSimulationRunning);

  useEffect(() => {
    // Start/stop simulation when setting changes
    if (isSimulationRunning && !prevRunning.current) {
      startSimulation();
    } else if (!isSimulationRunning && prevRunning.current) {
      stopSimulation();
    }
    prevRunning.current = isSimulationRunning;
  }, [isSimulationRunning, startSimulation, stopSimulation]);

  useEffect(() => {
    // Auto-start on mount if setting is enabled
    if (isSimulationRunning) {
      startSimulation();
    }
    // Cleanup on unmount
    return () => {
      stopSimulation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="w-full h-full bg-background text-foreground">
        <Layout />
      </div>
    </ThemeProvider>
  );
}

export default App;
