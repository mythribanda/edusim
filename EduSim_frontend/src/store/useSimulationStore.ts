import { create } from "zustand";

interface SimulationStore {
  // Tutor State
  currentTopic: string | null;
  tutorResponse: any | null;
  isLoadingTutor: boolean;
  isMaximized: boolean;
  
  // Actions
  setTopic: (topic: string) => void;
  setTutorResponse: (response: any) => void;
  setLoadingTutor: (loading: boolean) => void;
  setMaximized: (maximized: boolean) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  currentTopic: null,
  tutorResponse: null,
  isLoadingTutor: false,
  isMaximized: false,
  
  setTopic: (topic) => set({ currentTopic: topic }),
  setTutorResponse: (response) => set({ tutorResponse: response }),
  setLoadingTutor: (loading) => set({ isLoadingTutor: loading }),
  setMaximized: (maximized) => set({ isMaximized: maximized }),
}));
