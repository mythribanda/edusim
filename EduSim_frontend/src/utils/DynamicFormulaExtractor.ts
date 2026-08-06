import { formatLatexForDisplay } from "@/utils/latexDisplay";
import { getApiUrl } from "@/config/api";

export interface FormulaAnatomyRow {
  symbol: string;
  meaning: string;
  unit?: string;
}

export interface FormulaExample {
  title: string;
  content: string;
}

export interface FormulaPracticeQuestion {
  question: string;
  answer?: string;
}

export interface FormulaRevisionCard {
  front: string;
  back: string;
}

export interface FormulaControl {
  symbol: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface DynamicParsedFormula {
  id: string;
  raw: string;
  rawFormula?: string;
  expression: string;
  latex?: string;
  formula?: string;
  displayFormula?: string;
  title?: string;
  description?: string;
  category?: string;
  topic?: string;
  variables?: FormulaControl[];
  anatomy?: FormulaAnatomyRow[];
  examples?: FormulaExample[];
  practiceQuestions?: FormulaPracticeQuestion[];
  revisionCards?: FormulaRevisionCard[];
  relatedTopics?: string[];
  controls?: FormulaControl[];
  resultSymbol?: string;
  derived_expressions?: Record<string, string>;
}

const OFFLINE_FORMULA_BACKUP: Record<string, {
  title: string;
  description: string;
  anatomy: FormulaAnatomyRow[];
  controls: FormulaControl[];
  resultSymbol: string;
}> = {
  "F=MA": {
    title: "Newton's Second Law",
    description: "The rate of change of momentum of a body over time is directly proportional to the force applied, and occurs in the same direction as the applied force.",
    anatomy: [
      { symbol: "F", meaning: "Force applied", unit: "N" },
      { symbol: "m", meaning: "Mass of the object", unit: "kg" },
      { symbol: "a", meaning: "Acceleration", unit: "m/s²" }
    ],
    controls: [
      { symbol: "m", label: "Mass (m)", unit: "kg", min: 1, max: 100, step: 1, defaultValue: 10 },
      { symbol: "a", label: "Acceleration (a)", unit: "m/s²", min: 1, max: 20, step: 0.5, defaultValue: 9.8 }
    ],
    resultSymbol: "F"
  },
  "V=IR": {
    title: "Ohm's Law",
    description: "The current through a conductor between two points is directly proportional to the voltage across the two points.",
    anatomy: [
      { symbol: "V", meaning: "Voltage / Potential Difference", unit: "V" },
      { symbol: "I", meaning: "Electric Current", unit: "A" },
      { symbol: "R", meaning: "Electrical Resistance", unit: "Ω" }
    ],
    controls: [
      { symbol: "I", label: "Current (I)", unit: "A", min: 0.1, max: 10, step: 0.1, defaultValue: 2 },
      { symbol: "R", label: "Resistance (R)", unit: "Ω", min: 1, max: 100, step: 1, defaultValue: 10 }
    ],
    resultSymbol: "V"
  },
  "KE=1/2MV^2": {
    title: "Kinetic Energy",
    description: "The kinetic energy of an object is the energy that it possesses due to its motion.",
    anatomy: [
      { symbol: "KE", meaning: "Kinetic Energy", unit: "J" },
      { symbol: "m", meaning: "Mass of the object", unit: "kg" },
      { symbol: "v", meaning: "Velocity of the object", unit: "m/s" }
    ],
    controls: [
      { symbol: "m", label: "Mass (m)", unit: "kg", min: 1, max: 100, step: 1, defaultValue: 10 },
      { symbol: "v", label: "Velocity (v)", unit: "m/s", min: 1, max: 50, step: 1, defaultValue: 5 }
    ],
    resultSymbol: "KE"
  }
};

function parseGenericFormula(rawFormula: string): {
  title: string;
  description: string;
  anatomy: FormulaAnatomyRow[];
  controls: FormulaControl[];
  resultSymbol: string;
} {
  const clean = rawFormula.replace(/[\$\s]/g, "");
  const parts = clean.split("=");
  const resultSymbol = parts[0] || "y";
  const equation = parts[1] || parts[0] || "";

  // Extract all single letter variables from the equation
  const matches = Array.from(new Set(equation.match(/[a-zA-Z]/g) || []));
  const controls: FormulaControl[] = matches.map(symbol => ({
    symbol,
    label: `Variable ${symbol}`,
    unit: "",
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 10
  }));

  const anatomy: FormulaAnatomyRow[] = [
    { symbol: resultSymbol, meaning: "Calculated Result", unit: "" },
    ...matches.map(symbol => ({
      symbol,
      meaning: `Input parameter ${symbol}`,
      unit: ""
    }))
  ];

  return {
    title: `Formula ${rawFormula}`,
    description: `Mathematical relationship defining ${resultSymbol}.`,
    anatomy,
    controls,
    resultSymbol
  };
}

export const DynamicFormulaExtractor = {
  async parseTutorResponse(
    content: string,
    topic: string,
    subject?: string,
    classId?: string,
  ): Promise<DynamicParsedFormula[]> {
    console.log("[DynamicFormulaExtractor] Extracting via backend API...");

    try {
      // 1. Extract formulas from text
      const extractRes = await fetch(getApiUrl("/api/formula/extract"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, query: topic })
      });

      if (!extractRes.ok) throw new Error("Extraction failed");
      const extractData = await extractRes.json();
      const formulasList = extractData.formulas || [];

      // 2. Fetch metadata for each formula in parallel
      const parsedFormulasResults = await Promise.all(
        formulasList.map(async (f: any) => {
          try {
            let labData: any = null;

            try {
              const labRes = await fetch(getApiUrl("/api/formula/lab"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ formula: f.formula })
              });

              if (labRes.ok) {
                labData = await labRes.json();
              }
            } catch (fetchErr) {
              console.warn("Could not reach formula lab endpoint, using offline fallback.", fetchErr);
            }

            // Deduplicate controls based on symbol (so we don't have n1, n2, n_1 all duplicated)
            let uniqueControls: FormulaControl[] = [];
            const seenVars = new Set<string>();
            for (const v of (labData?.variables || [])) {
              if (!seenVars.has(v.symbol)) {
                seenVars.add(v.symbol);
                uniqueControls.push({
                  symbol: v.symbol,
                  label: v.label || v.symbol,
                  unit: v.unit || "",
                  min: v.min !== undefined ? v.min : 1,
                  max: v.max !== undefined ? v.max : 100,
                  step: v.step !== undefined ? v.step : 1,
                  defaultValue: v.defaultValue !== undefined ? v.defaultValue : 10
                });
              }
            }

            let anatomy: FormulaAnatomyRow[] = labData?.anatomy || [];
            let title = labData?.title || "Formula";
            let description = labData?.description || content;
            let resultSymbol = labData?.resultSymbol || "y";

            // If backend returned empty variable data, use premium local fallbacks
            if (anatomy.length === 0) {
              const cleanFormula = f.formula.replace(/[\$\s]/g, ""); // Strip $ and spaces
              const matchedKey = Object.keys(OFFLINE_FORMULA_BACKUP).find(key =>
                cleanFormula.toUpperCase().includes(key) ||
                key.includes(cleanFormula.toUpperCase())
              );

              if (matchedKey) {
                const backup = OFFLINE_FORMULA_BACKUP[matchedKey];
                title = backup.title;
                description = backup.description;
                anatomy = backup.anatomy;
                uniqueControls = backup.controls;
                resultSymbol = backup.resultSymbol;
              } else {
                const parsedGeneric = parseGenericFormula(f.formula);
                title = parsedGeneric.title;
                description = parsedGeneric.description;
                anatomy = parsedGeneric.anatomy;
                uniqueControls = parsedGeneric.controls;
                resultSymbol = parsedGeneric.resultSymbol;
              }
            }

            let formulaId = labData?.id || f.id;
            if (formulaId === "dynamic-formula" || formulaId === "fallback") {
              formulaId = f.id || `formula-${Math.random().toString(36).substring(2, 9)}`;
            }

            return {
              id: formulaId,
              raw: f.formula,
              rawFormula: f.formula,
              expression: f.formula,
              latex: f.formula,
              formula: f.formula,
              displayFormula: formatLatexForDisplay(f.formula),
              title,
              category: subject,
              topic,
              description,
              variables: uniqueControls,
              controls: uniqueControls,
              anatomy,
              examples: labData?.examples || [],
              resultSymbol,
              derived_expressions: labData?.derived_expressions || {}
            };
          } catch (e) {
            console.warn("Failed to load lab data for formula", f.formula, e);
            return null;
          }
        })
      );

      const parsedFormulas = parsedFormulasResults.filter((f): f is DynamicParsedFormula => f !== null);

      return parsedFormulas;
    } catch (e) {
      console.error("[DynamicFormulaExtractor] Error:", e);
      return [];
    }
  },
};
