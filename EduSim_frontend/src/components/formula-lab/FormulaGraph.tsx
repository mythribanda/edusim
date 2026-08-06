import React, { useMemo } from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { evaluate as mathEvaluate } from "mathjs";

const FormulaGraph: React.FC<{ 
  formula: DynamicParsedFormula | null;
  values: Record<string, number>;
}> = ({ formula, values }) => {
  const data = useMemo(() => {
    if (!formula) return [] as Array<{ x: number; y: number }>;
    const controls = Array.isArray(formula.controls) ? formula.controls : [];
    const resultSymbol = formula.resultSymbol || "result";
    const inputControls = controls.filter((c) => c.symbol !== resultSymbol);
    const isNewtonSecondLaw = formula.id === "newton-second-law" || formula.formula === "F=ma";
    const xVar = isNewtonSecondLaw ? inputControls.find((c) => c.symbol === 'a') : inputControls[inputControls.length - 1];
    if (!xVar) return [];

    const points: Array<{ x: number; y: number }> = [];

    if (isNewtonSecondLaw) {
        // DEMO SPECIFIC LOGIC for F = ma
        const m = values['m'] ?? 10;
        for (let a = 0; a <= 20; a += 1) {
            points.push({ x: a, y: m * a });
        }
        return points;
    }

    let expr = formula.expression || "";
    if (formula.derived_expressions && resultSymbol && formula.derived_expressions[resultSymbol]) {
      expr = formula.derived_expressions[resultSymbol];
    } else {
      const clean = expr.replace(/[\$\s]/g, "");
      const parts = clean.split("=");
      expr = parts[1] || parts[0];
      expr = expr
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
        .replace(/\\sin/g, "sin")
        .replace(/\\cos/g, "cos")
        .replace(/\\tan/g, "tan")
        .replace(/\\theta/g, "theta")
        .replace(/\\Delta/g, "Delta")
        .replace(/\\cdot/g, "*")
        .replace(/\\times/g, "*")
        .replace(/\^/g, "**")
        .replace(/\{/g, "(")
        .replace(/\}/g, ")");
    }

    const min = xVar.min || 0;
    const max = xVar.max || 20;
    const step = (max - min) / 50 || 1;
    for (let x = min; x <= max; x += step) {
        try {
            const scope = { ...values, [xVar.symbol]: x };
            const y = mathEvaluate(expr, scope);
            if (typeof y === 'number' && Number.isFinite(y)) {
                points.push({ x: Number(x.toPrecision(6)), y: Number(y.toPrecision(6)) });
            }
        } catch(e) {
            // ignore
        }
    }
    return points;
  }, [formula, values]);

  if (!formula) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card/85 p-6 text-sm text-muted-foreground text-center font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        Graph will appear when a formula is selected.
      </div>
    );
  }

  const controls = Array.isArray(formula.controls) ? formula.controls : [];
  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const resultSymbol = formula.resultSymbol || "result";
  const inputControls = controls.filter((c) => c.symbol !== resultSymbol);
  const isNewtonSecondLaw = formula.id === "newton-second-law" || formula.formula === "F=ma";
  const xVar = isNewtonSecondLaw ? inputControls.find(c => c.symbol === 'a') : inputControls[inputControls.length - 1];
  const xLabel = xVar ? (anatomy.find(a => a.symbol === xVar?.symbol)?.meaning || xVar?.symbol) : "x";
  const yLabel = anatomy.find(a => a.symbol === resultSymbol)?.meaning || resultSymbol;
  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";

  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-8 text-center text-muted-foreground font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        This formula does not have enough variables or data configured to generate a live graph.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Live Graph</p>
          <h3 className="mt-1 text-lg font-black text-foreground tracking-tight">{yLabel} vs {xLabel}</h3>
        </div>
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-secondary/40 border border-border/60 px-2.5 py-1 rounded">
          {title}
        </div>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
            <XAxis dataKey="x" stroke="rgba(120,130,150,0.5)" tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
            <YAxis stroke="rgba(120,130,150,0.5)" tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }} labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }} itemStyle={{ color: "#7c3aed" }} />
            <Line type="monotone" dataKey="y" stroke="#7c3aed" strokeWidth={3.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FormulaGraph;
