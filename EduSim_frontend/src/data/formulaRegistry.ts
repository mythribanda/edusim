export interface FormulaDefinition {
  id: string;
  title: string;
  expression: string;
  variables: Record<string, string>;
  unitMap: Record<string, string>;
  graph: "line" | "parabola" | "inverse" | "custom";
  simulation: "force-motion" | "circuit-flow" | "rolling-ball" | "trajectory-arc" | "generic";
  category: "physics" | "math" | "chemistry";
}

export const formulaRegistry: Record<string, FormulaDefinition> = {
  "F=ma": {
    id: "newton-second-law",
    title: "Newton's Second Law",
    expression: "F = m \\times a",
    variables: {
      F: "Force",
      m: "Mass",
      a: "Acceleration",
    },
    unitMap: {
      F: "N",
      m: "kg",
      a: "m/s²",
    },
    graph: "line",
    simulation: "force-motion",
    category: "physics",
  },
  "V=IR": {
    id: "ohms-law",
    title: "Ohm's Law",
    expression: "V = I \\times R",
    variables: {
      V: "Voltage",
      I: "Current",
      R: "Resistance",
    },
    unitMap: {
      V: "V",
      I: "A",
      R: "Ω",
    },
    graph: "line",
    simulation: "circuit-flow",
    category: "physics",
  },
  "KE=1/2mv^2": {
    id: "kinetic-energy",
    title: "Kinetic Energy",
    expression: "KE = \\frac{1}{2} m v^2",
    variables: {
      KE: "Kinetic Energy",
      m: "Mass",
      v: "Velocity",
    },
    unitMap: {
      KE: "J",
      m: "kg",
      v: "m/s",
    },
    graph: "parabola",
    simulation: "rolling-ball",
    category: "physics",
  },
};
