import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { BlockMath } from "@/components/math/Katex";

interface Props {
  formulas?: DynamicParsedFormula[] | null;
  selected?: string | undefined;
  onSelect: (raw: string) => void;
}

const FormulaNavigator: React.FC<Props> = ({ formulas, selected, onSelect }) => {
  if (!Array.isArray(formulas)) {
    return (
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
        Loading formulas...
      </div>
    );
  }

  console.log("[FormulaNavigator] FormulaLab data:", formulas);

  const validFormulas = formulas.filter((formula): formula is DynamicParsedFormula =>
    Boolean(
      formula &&
      typeof formula === "object" &&
      (formula.displayFormula || formula.formula || formula.latex || formula.title || formula.raw),
    ),
  );

  if (validFormulas.length === 0) {
    return (
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
        No formulas detected for this topic.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto sticky top-0 bg-transparent py-3">
      <ul className="flex gap-4 px-2 min-h-[240px] pb-2">
        {validFormulas.map((f, idx) => {
          const isSelected = selected === f.id || selected === f.raw;
          const title = (f.title || f.displayFormula || f.formula || f.raw || "Formula").slice(
            0,
            40,
          );
          const latex = f.latex || f.formula || "";
          const description = (f.description || "").slice(0, 180);
          const category = "Dynamic";
          const anatomy = Array.isArray(f.anatomy) ? f.anatomy : [];

          return (
            <li key={f.id || f.raw} className="min-w-[360px]">
              <button
                onClick={() => onSelect(f.id || f.raw)}
                className={`w-full h-[220px] rounded-[1.75rem] border p-5 text-left glass-card transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${isSelected ? "ring-2 ring-indigo-400/80 border-indigo-300/40 shadow-[0_20px_60px_rgba(99,102,241,0.25)]" : "border-white/10 bg-white/6"}`}
              >
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                        {idx === 0 && <span className="text-yellow-400">⭐</span>}
                        <span>{category}</span>
                      </div>
                      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
                    </div>
                    {isSelected && (
                      <span className="rounded-full border border-indigo-300/40 bg-indigo-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-200">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-center shadow-inner">
                    <div className="overflow-x-auto">
                      {latex ? (
                        <BlockMath math={latex} />
                      ) : (
                        <p className="text-sm text-muted-foreground">No formula preview</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm leading-6 text-muted-foreground line-clamp-2">
                      {description || "No description available"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {anatomy.slice(0, 3).map((row) => (
                        <span
                          key={row.symbol}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-foreground/90"
                        >
                          {row.symbol} · {row.meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FormulaNavigator;
