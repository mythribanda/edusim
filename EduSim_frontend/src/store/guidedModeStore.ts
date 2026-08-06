import { create } from 'zustand';

export interface BuildStep {
  step_number: number;
  title: string;
  description: string;
  icon: string;
}

export interface SpawnConfigBody {
  id: string;
  type: 'circle' | 'rectangle';
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  isStatic: boolean;
  mass?: number;
  restitution?: number;
  fillColor?: string;
  label?: string;
}

export interface SpawnConfigConstraint {
  id: string;
  type: 'rope' | 'spring';
  bodyIdA: string;
  bodyIdB: string;
  length?: number;
  stiffness?: number;
  damping?: number;
}

export interface SpawnConfig {
  bodies: SpawnConfigBody[];
  constraints: SpawnConfigConstraint[];
  gravityMode: 'linear' | 'radial';
  gravityPreset: 'zero' | 'moon' | 'earth' | 'jupiter';
  forces?: Array<{
    bodyId: string;
    vector: { x: number; y: number };
  }>;
}

export interface SimulationGuide {
  is_buildable: boolean;
  title: string;
  steps: BuildStep[];
  tips: string[];
  spawn_config?: SpawnConfig;
}

interface GuidedModeStore {
  mode: 'guided' | 'assisted' | 'challenge';
  isOpen: boolean;
  activeStep: number;
  completedSteps: number[];
  guideData: SimulationGuide | null;
  highlightedAsset: string | null;
  showMeOverlay: { x: number; y: number; type: string } | null;

  setMode: (mode: 'guided' | 'assisted' | 'challenge') => void;
  setIsOpen: (open: boolean) => void;
  setActiveStep: (step: number) => void;
  setGuideData: (data: SimulationGuide | null) => void;
  markStepComplete: (step: number) => void;
  setHighlightedAsset: (asset: string | null) => void;
  setShowMeOverlay: (overlay: { x: number; y: number; type: string } | null) => void;
  reset: () => void;
}

export const useGuidedModeStore = create<GuidedModeStore>((set) => ({
  mode: 'guided',
  isOpen: false,
  activeStep: 1,
  completedSteps: [],
  guideData: null,
  highlightedAsset: null,
  showMeOverlay: null,

  setMode: (mode) => set({ mode }),
  setIsOpen: (isOpen) => set({ isOpen }),
  setActiveStep: (activeStep) => set({ activeStep }),
  setGuideData: (guideData) =>
    set({
      guideData,
      activeStep: 1,
      completedSteps: [],
      highlightedAsset: null,
      showMeOverlay: null,
    }),
  markStepComplete: (step) =>
    set((s) => {
      if (s.completedSteps.includes(step)) return {};
      return { completedSteps: [...s.completedSteps, step] };
    }),
  setHighlightedAsset: (highlightedAsset) => set({ highlightedAsset }),
  setShowMeOverlay: (showMeOverlay) => set({ showMeOverlay }),
  reset: () =>
    set({
      isOpen: false,
      activeStep: 1,
      completedSteps: [],
      guideData: null,
      highlightedAsset: null,
      showMeOverlay: null,
    }),
}));
