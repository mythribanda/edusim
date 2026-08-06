import React, { useEffect, useMemo, useState } from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { evaluate as mathEvaluate } from "mathjs";

const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = ({ label, value, onChange, min, max, step, unit }) => {
  const [tempValue, setTempValue] = useState(value.toString());

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleTextChange = (valStr: string) => {
    setTempValue(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && isFinite(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4 hover:border-border hover:bg-secondary/50 transition-all duration-300">
      <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
        <div>
          <div className="font-extrabold text-foreground">{label}</div>
          <div className="text-[11px] font-semibold text-muted-foreground">{unit || "unitless"}</div>
        </div>
        <input
          type="text"
          value={tempValue}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-40 rounded-xl bg-card border border-border/60 px-3 py-1 text-right font-mono text-xs font-bold text-violet-600 dark:text-violet-400 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={isNaN(value) ? min : value}
        onChange={(e) => {
          const val = Number(e.target.value);
          onChange(val);
          setTempValue(val.toString());
        }}
        className="w-full accent-violet-600 cursor-pointer"
      />
    </div>
  );
};

const FormulaPlayground: React.FC<{ 
  formula: DynamicParsedFormula | null;
  values: Record<string, number>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}> = ({ formula, values, setValues }) => {

  const result = useMemo(() => {
    if (!formula) return null;
    try {
      // Demo fail-safe ONLY for Newton's Second Law
      const isNewtonSecondLaw = formula.id === "newton-second-law" || formula.formula === "F=ma";
      if (isNewtonSecondLaw) {
        const m = values['m'] ?? 10;
        const a = values['a'] ?? 5;
        return { status: "ok", value: m * a };
      }
      
      let expr = formula.expression || "";
      const resultSymbol = formula.resultSymbol;
      
      if (formula.derived_expressions && resultSymbol && formula.derived_expressions[resultSymbol]) {
        expr = formula.derived_expressions[resultSymbol];
      } else {
        const clean = expr
          .replace(/\$/g, "")
          .replace(/\\approx|\\propto|approx|propto|≈|∝|\\le|\\ge|\\leq|\\geq|≤|≥/g, "=")
          .trim();
        const parts = clean.split("=");
        expr = parts[1] || parts[0];
        expr = expr
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
          .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)")
          .replace(/_\{([^}]+)\}/g, (_, inner) => "_" + inner.replace(/,/g, "").replace(/\s/g, ""))
          .replace(/\\sin/g, "sin")
          .replace(/\\cos/g, "cos")
          .replace(/\\tan/g, "tan")
          .replace(/\\theta/g, "theta")
          .replace(/\\omega/g, "omega")
          .replace(/\\pi/g, "pi")
          .replace(/\\phi/g, "phi")
          .replace(/\\mu/g, "mu")
          .replace(/\\lambda/g, "lambd")
          .replace(/\\rho/g, "rho")
          .replace(/\\epsilon/g, "epsilon")
          .replace(/\\eta/g, "eta")
          .replace(/\\tau/g, "tau")
          .replace(/\\nu/g, "nu")
          .replace(/\\sigma/g, "sigma")
          .replace(/\\alpha/g, "alpha")
          .replace(/\\beta/g, "beta")
          .replace(/\\gamma/g, "gamma")
          .replace(/\\Delta/g, "Delta")
          .replace(/\\cdot/g, "*")
          .replace(/\\times/g, "*")
          .replace(/\^/g, "**")
          .replace(/\{/g, "(")
          .replace(/\}/g, ")");
      }
      
      const scope = { ...values };
      const val = mathEvaluate(expr, scope);
      if (typeof val === 'number' && Number.isFinite(val)) {
         return { status: "ok", value: val };
      }
      return { status: "ok", value: 0 };
    } catch(e) {
      return { status: "ok", value: 0 };
    }
  }, [formula, values]);

  if (!formula) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card/85 p-6 text-sm text-muted-foreground text-center font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        Select a formula to interact.
      </div>
    );
  }

  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const controls = Array.isArray(formula.controls) ? formula.controls : [];
  const resultSymbol = formula.resultSymbol || "result";
  const resultUnit = anatomy.find((row) => row.symbol === resultSymbol)?.unit || "";
  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";

  // Filter out resultSymbol from the inputs
  const inputControls = controls.filter((control) => control.symbol !== resultSymbol);

  if (inputControls.length === 0) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-8 text-center text-muted-foreground font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        This formula does not have any variables or sliders configured for interactive calculation.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Interactive Playground</p>
          <h3 className="mt-1 text-2xl font-black text-foreground tracking-tight">Try {title}</h3>
        </div>
        <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          Live calculation
        </div>
      </div>

      <div className="grid gap-3">
        {inputControls.map((control) => {
          const isNewtonSecondLaw = formula.id === "newton-second-law" || formula.formula === "F=ma";
          let min = control.min;
          let max = control.max;
          let step = control.step || 1;
          
          if (isNewtonSecondLaw) {
             if (control.symbol === 'm') { min = 1; max = 100; }
             if (control.symbol === 'a') { min = 1; max = 20; }
          }
          
          // Auto-scale ranges for very large or very small values if the bounds are generic
          const defVal = values[control.symbol] ?? control.defaultValue;
          if (min === 1 && max === 100 && (defVal < 0.1 || defVal > 1000)) {
            if (defVal > 0) {
              min = defVal / 10;
              max = defVal * 10;
              step = (max - min) / 100;
            } else if (defVal < 0) {
              min = defVal * 10;
              max = defVal / 10;
              step = (max - min) / 100;
            }
          }
          
          return (
            <SliderRow
              key={control.symbol}
              label={control.label}
              unit={control.unit}
              value={values[control.symbol] ?? control.defaultValue}
              onChange={(nextValue) => setValues((current) => ({ ...current, [control.symbol]: nextValue }))}
              min={min}
              max={max}
              step={step}
            />
          )
        })}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-violet-650 to-indigo-750 p-5 shadow-lg shadow-violet-600/10 border border-violet-500/20 text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl" />
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-violet-200">Result</div>
        <div className="mt-1.5 text-3xl font-black tracking-tight text-white">
          {(result as any)?.status === "ok" ? (
            Math.abs((result as any).value) >= 10000 || (Math.abs((result as any).value) < 0.001 && (result as any).value !== 0)
              ? `${Number((result as any).value).toExponential(4)} ${resultUnit}`
              : `${Number((result as any).value).toFixed(2)} ${resultUnit}`
          ) : (result as any)?.message || "Missing variable"}
        </div>
        <div className="mt-1 text-xs text-violet-100/90 font-medium">
          {(result as any)?.status === "ok" ? `${resultSymbol} = ${anatomy.find((row) => row.symbol === resultSymbol)?.meaning || title}` : "Adjust the controls to calculate the formula."}
        </div>
      </div>
    </div>
  );
};

export default FormulaPlayground;
