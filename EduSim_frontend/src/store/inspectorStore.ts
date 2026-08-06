import { create } from 'zustand';

interface InspectorController {
  id: string;
  label: string;
  property: string;
  min: number;
  max: number;
  default: number;
  educationalPurpose: string;
}

interface InspectorStore {
  selectedObject: any | null;
  setSelectedObject: (obj: any | null) => void;
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  controllers: InspectorController[];
  setControllers: (controllers: InspectorController[]) => void;
}

export const useInspectorStore = create<InspectorStore>((set) => ({
  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),
  showDebug: false,
  setShowDebug: (show) => set({ showDebug: show }),
  controllers: [],
  setControllers: (controllers) => set({ controllers }),
}));
