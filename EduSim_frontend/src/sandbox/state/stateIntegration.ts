/**
 * Runtime state integration utilities for connecting SandboxCanvas
 * with the RuntimeStore.
 *
 * This module provides helper functions to sync the sandbox state
 * with the centralized runtime store as objects are created, selected,
 * and destroyed.
 */

import type { RuntimeObject } from '../types/RuntimeObject';
import type { RuntimeStore } from './runtimeStore';
import type { ObjectRegistry } from './objectRegistry';

export interface StateIntegrationHooks {
  onObjectAdded: (obj: RuntimeObject) => void;
  onObjectRemoved: (id: string) => void;
  onSelectionChanged: (obj: RuntimeObject | null) => void;
  onRuntimeStateChanged: (state: 'running' | 'paused') => void;
}

/**
 * Create integration hooks that sync SandboxCanvas state with RuntimeStore.
 */
export function createIntegrationHooks(store: RuntimeStore): StateIntegrationHooks {
  return {
    onObjectAdded: (obj: RuntimeObject) => {
      store.addObject(obj);
    },
    onObjectRemoved: (id: string) => {
      store.removeObject(id);
    },
    onSelectionChanged: (obj: RuntimeObject | null) => {
      if (obj) {
        store.setSelectedObject(obj.id);
      } else {
        store.clearSelection();
      }
    },
    onRuntimeStateChanged: (state: 'running' | 'paused') => {
      store.setRuntimeState(state === 'running' ? 'running' : 'paused');
    },
  };
}

/**
 * Get a formatted debug summary of the current runtime state.
 */
export function getStateDebugInfo(store: RuntimeStore): string {
  const summary = store.getSummary();
  const lines = [
    `═══════════════════════════════════`,
    `Runtime State Summary`,
    `═══════════════════════════════════`,
    `State:        ${summary.state}`,
    `Objects:      ${summary.objectCount}`,
    `Constraints:  ${summary.constraintCount}`,
    `Observables:  ${summary.observableCount}`,
    `Selected:     ${summary.selectedObjectId || 'none'}`,
    `Simulation:   ${summary.simulationTime}ms (${summary.frameCount} frames)`,
    `═══════════════════════════════════`,
  ];
  return lines.join('\n');
}
