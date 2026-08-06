import { useState, useEffect, useCallback } from "react";
import { simulationStorage } from "@/lib/simulationStorage";
import type { SavedSimulation } from "@/types/saved-simulation";

/**
 * Custom hook to manage saved simulations library.
 * Handles storage, filtering, and CRUD operations entirely on the frontend.
 */
export function useSavedSimulations() {
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);

  // Initial load from storage
  useEffect(() => {
    setSimulations(simulationStorage.load());
  }, []);

  const saveSimulation = useCallback((sim: Omit<SavedSimulation, "createdAt" | "favorite">) => {
    const newSim: SavedSimulation = {
      ...sim,
      createdAt: new Date().toISOString(),
      favorite: false,
    };

    setSimulations((prev) => {
      const filtered = prev.filter((s) => s.id !== sim.id);
      const updated = [newSim, ...filtered];
      simulationStorage.save(updated);
      return updated;
    });
  }, []);

  const deleteSimulation = useCallback((id: string) => {
    setSimulations((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      simulationStorage.save(updated);
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setSimulations((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, favorite: !s.favorite } : s
      );
      simulationStorage.save(updated);
      return updated;
    });
  }, []);

  return {
    simulations,
    saveSimulation,
    deleteSimulation,
    toggleFavorite,
  };
}
