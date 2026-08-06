import type { SimulationGuide } from '../../store/guidedModeStore';

export interface SandboxValidationState {
  bodies: any[];
  constraints: any[];
  gravityMode: 'linear' | 'radial';
  gravityPreset: string;
  running: boolean;
}

export function validateStep(
  stepNumber: number,
  guideData: SimulationGuide | null,
  state: SandboxValidationState
): boolean {
  if (!guideData || !guideData.steps || !Array.isArray(guideData.steps)) return false;
  const steps = guideData.steps;
  if (stepNumber < 1 || stepNumber > steps.length) return false;

  const currentStep = steps[stepNumber - 1];
  if (!currentStep) return false;
  const stepTitle = (currentStep.title || '').toLowerCase();
  const stepDesc = (currentStep.description || '').toLowerCase();

  // HEURISTIC-BASED DYNAMIC VALIDATION:
  // We match keywords from the step description to determine validation rules dynamically!

  // 1. Spawning / Creating Objects
  if (stepTitle.includes('spawn') || stepTitle.includes('create') || stepTitle.includes('place') || stepDesc.includes('spawn') || stepDesc.includes('drag')) {
    // If the step is about spawning the pivot, ground, stand or first body
    if (stepNumber === 1) {
      return state.bodies.length >= 1;
    }
    // If the step is about spawning the second body (bob, satellite, secondary body)
    if (stepNumber === 2 || stepTitle.includes('bob') || stepTitle.includes('satellite') || stepTitle.includes('planet')) {
      return state.bodies.length >= 2;
    }
    return state.bodies.length >= 1;
  }

  // 2. Connecting / Constraints / Rope / Spring
  if (stepTitle.includes('connect') || stepTitle.includes('constraint') || stepTitle.includes('rope') || stepTitle.includes('spring') || stepDesc.includes('link') || stepDesc.includes('connect') || stepDesc.includes('rope') || stepDesc.includes('spring')) {
    // Check if there are any constraints or ropes created
    return state.constraints.length >= 1;
  }

  // 3. Modifying gravity or settings
  if (stepTitle.includes('gravity') || stepDesc.includes('gravity') || stepTitle.includes('preset') || stepDesc.includes('preset')) {
    return state.gravityPreset !== 'earth' || state.gravityMode === 'radial';
  }

  // 4. Starting motion / play / simulation running
  if (stepTitle.includes('play') || stepTitle.includes('start') || stepTitle.includes('run') || stepDesc.includes('click play') || stepDesc.includes('simulation speed') || stepTitle.includes('motion')) {
    return state.running;
  }

  // 5. Final/Conclusion steps or generic fallbacks
  if (stepNumber === steps.length) {
    // Last step (Step 6) is usually conclusion / observations
    return state.running;
  }

  // Generic fallback: check if body count matches or is greater than the step number
  return state.bodies.length >= Math.min(stepNumber, 2);
}
