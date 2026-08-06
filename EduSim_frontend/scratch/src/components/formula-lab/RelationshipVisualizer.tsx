import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";

const RelationshipVisualizer: React.FC<{ formula: DynamicParsedFormula | null; formulas?: DynamicParsedFormula[] }> = ({ formula }) => {
  if (!formula) return <div className="p-4 glass-card">No formula selected.</div>;

  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const vars = anatomy.map(a => a.symbol);
  const expr = formula.expression || '';

  function detectRelation(variable: string) {
    const v = variable;
    const reSquared = new RegExp(`${v}\\s*\\^\\s*2|${v}²`,'i');
    const reInverse = new RegExp(`1\\s*\\/?\\s*${v}|\\/${v}\\b`,'i');
    const reExp = /e\^|exp\(/i;
    if (reSquared.test(expr)) return 'Quadratic';
    if (reInverse.test(expr)) return 'Inverse';
    if (reExp.test(expr) || /exponential/i.test(expr)) return 'Exponential';
    // default: if variable present on RHS, direct
    if (new RegExp(`\\b${v}\\b`).test(expr)) return 'Direct';
    return 'None';
  }

  return (
    <div className="p-4 glass-card">
      <h3 className="text-lg font-semibold">Relationship Visualizer</h3>
      <div className="mt-3 flex flex-col gap-3">
        {vars.map((v) => {
          const rel = detectRelation(v);
          const an = anatomy.find(a => a.symbol === v);
          return (
            <div key={v} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium">{v}</div>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-3 bg-white/5 rounded" />
                <div className="text-xs font-semibold px-2 py-1 rounded bg-white/6">{rel}</div>
              </div>
              <div className="w-20 text-right text-sm">{an?.unit || ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelationshipVisualizer;
