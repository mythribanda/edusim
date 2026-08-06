import React, { useState } from "react";
import { FormulaGraph } from "@/utils/formulaTemplates";
import { FormulaSimulation } from "@/utils/formulaTemplates";
import { extractFormulas } from "@/utils/formulaParser";
import { BlockMath } from "@/components/math/Katex";
import { Activity, BookOpen, Calculator, LineChart, PlaySquare, HelpCircle, X } from "lucide-react";
import { useTutorStore } from "@/store/tutorStore";
import FormulaCalculator from "./FormulaCalculator";

interface Props {
  formulaRaw: string;
}

type TabType = "overview" | "calculator" | "graph" | "simulation" | "quiz";

export default function InteractiveFormulaCard({ formulaRaw }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { setActiveFormulaId } = useTutorStore();

  // Extract formula details
  const parsed = extractFormulas(formulaRaw);
  const formulaDef = parsed[0]?.matchedDefinition;

  const title = formulaDef?.title || "Formula Explanation";
  const expression = formulaDef?.expression || formulaRaw;
  const variables = formulaDef?.variables || {};

  const tabs = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "calculator", label: "Calculator", icon: Calculator },
    { id: "graph", label: "Graph", icon: LineChart },
    { id: "simulation", label: "Simulation", icon: PlaySquare },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
  ] as const;

  return (
    <div className="w-full rounded-[1.75rem] border border-border bg-card shadow-2xl overflow-hidden mt-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setActiveFormulaId(null)}
          className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Header / KaTeX Display */}
      <div className="pt-8 pb-6 px-6 bg-secondary/30 border-b border-border flex flex-col items-center">
        <h4 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {title}
        </h4>
        <div className="text-2xl sm:text-3xl md:text-4xl overflow-x-auto w-full max-w-full custom-scrollbar py-2 text-center">
          <BlockMath math={expression} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6 min-h-[300px]">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Variables</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(variables).length > 0 ? (
                Object.entries(variables).map(([symbol, name]) => (
                  <div key={symbol} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-serif italic text-lg">
                      {symbol}
                    </div>
                    <span className="text-sm text-muted-foreground">{name}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Unknown formula. No variables mapped.</p>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/95 transition-colors">
                Generate Quiz from Formula
              </button>
            </div>
          </div>
        )}

        {activeTab === "calculator" && (
          <div className="h-full min-h-[300px]">
            <React.Suspense fallback={<div className="flex items-center justify-center">Loading calculator...</div>}>
              <FormulaCalculator formulaDef={formulaDef} />
            </React.Suspense>
          </div>
        )}

        {activeTab === "graph" && (
          <div className="w-full h-[300px] relative">
            <React.Suspense fallback={<div className="absolute inset-0 flex items-center justify-center">Loading graph...</div>}>
              <FormulaGraph formulaDef={formulaDef} />
            </React.Suspense>
          </div>
        )}

        {activeTab === "simulation" && (
          <div className="w-full h-[300px] relative flex items-center justify-center bg-secondary/20 rounded-2xl border border-border overflow-hidden">
            <React.Suspense fallback={<div className="absolute inset-0 flex items-center justify-center">Loading simulation...</div>}>
              <FormulaSimulation formulaDef={formulaDef} />
            </React.Suspense>
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <HelpCircle className="w-8 h-8 text-primary/70 mb-4" />
            <p>Generate a mini-quiz specifically for this formula.</p>
          </div>
        )}
      </div>
    </div>
  );
}
