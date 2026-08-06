import React, { useState } from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";

const RevisionCards: React.FC<{ formula: DynamicParsedFormula | null }> = ({ formula }) => {
  const [idx, setIdx] = useState(0);
  const cards = Array.isArray(formula?.revisionCards) ? formula.revisionCards : [];

  if (!formula || cards.length === 0) return null;

  const cur = cards[idx % cards.length];

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Revision Cards</p>
        <h3 className="mt-2 text-xl font-bold">Quick recall</h3>
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
        <div className="font-semibold">{cur.front}</div>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-violet-300">Show answer</summary>
          <div className="mt-3 text-sm text-muted-foreground">{cur.back}</div>
        </details>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setIdx((current) => (current - 1 + cards.length) % cards.length)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold">Prev</button>
        <button onClick={() => setIdx((current) => (current + 1) % cards.length)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold">Next</button>
      </div>
    </div>
  );
};

export default RevisionCards;
