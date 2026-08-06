import React, { lazy } from "react";
import { FormulaDefinition } from "@/data/formulaRegistry";

// Lazy load the complex graphs and simulations
export const FormulaGraph = lazy(() => import("@/components/tutor/FormulaGraph"));
export const FormulaSimulation = lazy(() => import("@/components/tutor/FormulaSimulation"));

export function getGraphComponent(def: FormulaDefinition) {
  // Can add custom logic here if different formulas need entirely different Graph components
  return FormulaGraph;
}

export function getSimulationComponent(def: FormulaDefinition) {
  // Can add custom logic here if different formulas need entirely different Sim components
  return FormulaSimulation;
}
