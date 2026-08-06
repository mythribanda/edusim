import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { BlockMath } from "@/components/math/Katex";

function cleanAndTruncate(text: string, maxWords: number): string {
  if (!text) return "";
  // Strip Markdown headings like "### " or "## "
  let cleaned = text.replace(/#+\s*/g, "");
  // Strip bold/italic symbols like "**" or "*"
  cleaned = cleaned.replace(/\*\*|__/g, "");
  cleaned = cleaned.replace(/\*|_/g, "");
  // Split into words, limit, and join
  const words = cleaned.trim().split(/\s+/);
  if (words.length <= maxWords) return cleaned;
  return words.slice(0, maxWords).join(" ") + "...";
}


const FormulaAnatomy: React.FC<{
  formula: DynamicParsedFormula | null;
  mode?: "overview" | "variables";
}> = ({ formula, mode }) => {
  if (!formula) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card/85 p-6 text-sm text-muted-foreground text-center font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        Select a formula to see anatomy.
      </div>
    );
  }

  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";
  const latex = formula.latex || formula.formula || "";
  const rawDescription = formula.description || "No description available.";
  const description = cleanAndTruncate(rawDescription, 30);
  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
      {(!mode || mode === "overview") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Selected Formula</p>
              <h3 className="mt-1 text-2xl font-black text-foreground tracking-tight">{title}</h3>
            </div>
            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Interactive
            </span>
          </div>
          <div className="rounded-2xl border border-border/50 bg-secondary/40 px-4 py-6 text-center text-foreground shadow-inner">
            {latex ? <BlockMath math={latex} /> : <p className="text-sm text-muted-foreground font-medium">No formula preview available.</p>}
          </div>
          <p className="text-sm leading-6 text-foreground/80 font-normal">{description}</p>
        </div>
      )}

      {(!mode || mode === "variables") && (
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Formula Variables</h4>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border/60 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Meaning</th>
                  <th className="px-4 py-3">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {anatomy.length > 0 ? (
                  anatomy.map((row, index) => (
                    <tr key={row.symbol} className={index % 2 === 0 ? "bg-secondary/20" : "bg-transparent"}>
                      <td className="px-4 py-3 font-mono font-extrabold text-violet-500 dark:text-violet-400">{row.symbol}</td>
                      <td className="px-4 py-3 text-foreground/80 font-normal">{row.meaning}</td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{row.unit || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground font-medium">
                      No variable mappings available for this formula.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaAnatomy;
