import { create } from "zustand";

export type TutorMode = "Learn" | "Solve" | "Visualize" | "Quiz";

interface TutorState {
  currentMode: TutorMode;
  setMode: (mode: TutorMode) => void;

  // Interactive Formula State
  activeFormulaId: string | null;
  setActiveFormulaId: (id: string | null) => void;
  // Inline Formula Lab UI state
  showInlineFormulaLab: boolean;
  setShowInlineFormulaLab: (v: boolean) => void;
  inlineRagContent: string | null;
  setInlineRagContent: (c: string | null) => void;
}

export const useTutorStore = create<TutorState>((set) => ({
  currentMode: "Learn",
  setMode: (mode) => set({ currentMode: mode }),

  activeFormulaId: null,
  setActiveFormulaId: (id) => set({ activeFormulaId: id }),
  showInlineFormulaLab: false,
  setShowInlineFormulaLab: (v) => set({ showInlineFormulaLab: v }),
  inlineRagContent: null,
  setInlineRagContent: (c) => set({ inlineRagContent: c }),
}));
