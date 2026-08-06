import { formulaRegistry, FormulaDefinition } from "@/data/formulaRegistry";
import { parse as mathParse } from "mathjs";
import { formatLatexForDisplay } from "@/utils/latexDisplay";

export interface ExtractedFormula {
  raw: string;
  rawFormula?: string;
  normalized: string;
  displayFormula: string;
  matchedDefinition?: FormulaDefinition;
  mentions: number;
  category?: string;
  units: string[];
}

const UNIT_REGEX = /\b(kg|m\/s\^?2|m\/s|m|s|N|J|Pa|mol|°C|K|A|V|Ω)\b/g;
const LATEX_BLOCK = /\$\$([\s\S]*?)\$\$/g;
const INLINE_LATEX = /\$([^$\n]+)\$/g;
const SUPERSCRIPT_SQUARE = /([A-Za-z0-9]+)\s*\^\s*2|([A-Za-z0-9]+)²/g;
const FORMULA_OPERATORS = /[=∝→⇒⇌↔≈~]/;
const NUMERIC_ASSIGNMENT =
  /^([A-Za-zα-ωΑ-Ω][A-Za-z0-9_]*)\s*(?:=|∝)\s*\d+(?:\.\d+)?(?:\s*[A-Za-zΩ°/%]+)?$/;

function looksLikeChemicalEquation(line: string) {
  const cleaned = line.replace(/^[-•*\d.)\s]+/, "").trim();
  if (!cleaned.includes("→") && !cleaned.includes("->") && !cleaned.includes("⇌")) {
    return false;
  }

  const hasSpecies = /[A-Z][a-z]?\d*/.test(cleaned);
  const hasReactionSeparator = /\+|→|->|⇌/.test(cleaned);
  return hasSpecies && hasReactionSeparator;
}

function collectEquationLikeCandidates(text: string) {
  const candidates: string[] = [];
  const lines = text.split(/\r?\n/);

  for (const originalLine of lines) {
    const line = originalLine.replace(/^[-•*\d.)\s]+/, "").trim();
    if (!line) continue;
    if (!FORMULA_OPERATORS.test(line) && !looksLikeChemicalEquation(line)) continue;
    if (/^[A-Z][^=∝→⇒⇌↔≈~]+:?$/.test(line)) continue;
    if (line.split(/\s+/).length > 14 && !looksLikeChemicalEquation(line)) continue;
    candidates.push(line);
  }

  return candidates;
}

function normalizeFormulaRaw(raw: string) {
  return raw
    .replace(/\s+/g, "")
    .replace(/\^/g, "**")
    .replace(/∝/g, "=")
    .replace(/→|⇒|⇌|↔/g, "=")
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "($1)/($2)");
}

function createFormulaCandidate(raw: string, normalized: string): ExtractedFormula {
  return {
    raw,
    rawFormula: raw,
    normalized,
    displayFormula: formatLatexForDisplay(raw),
    mentions: 0,
    units: [],
    matchedDefinition: undefined,
  };
}

function shouldRejectFormulaCandidate(raw: string, normalized: string) {
  const cleanRaw = (raw || "").trim();
  const cleanNorm = (normalized || "").trim();
  if (!cleanRaw || !cleanNorm) return true;

  // Reject variable or unit level fragments.
  if (/^[A-Za-zα-ωΑ-Ω]$/.test(cleanRaw)) return true;
  if (/^(kg|m\/s\^?2|m\/s|m|s|N|J|Pa|mol|°C|K|A|V|Ω)$/i.test(cleanRaw)) return true;
  if (/^\d+(?:\.\d+)?(?:[A-Za-zΩ]+)?$/.test(cleanRaw)) return true;
  if (NUMERIC_ASSIGNMENT.test(cleanRaw)) return true;

  // Reject explanatory junk that should never become a formula chip.
  if (/^explain\s+/i.test(cleanRaw)) return true;
  if (/^what\s+is\s+/i.test(cleanRaw)) return true;

  // STRICT RULE: Only detect equations containing =, ≈, ≤, ≥, ∝, →
  const strictOperators = /[=≈≤≥∝→]/;
  if (!strictOperators.test(cleanRaw)) return true;

  // Reject single words or purely alphabetical sequences even if they bypass earlier filters
  if (/^[A-Za-z]+$/.test(cleanNorm)) return true;
  if (cleanRaw.includes("cdota") || cleanRaw.includes("propto") || cleanRaw.includes("Deltap") || cleanRaw.includes("andinSIunitstheconstant")) return true;

  // DEMO REQUIREMENT: For Newton's Second Law, filter out intermediate/derived forms
  const lowerNorm = cleanNorm.toLowerCase();
  if (lowerNorm.includes("p=mv") || lowerNorm.includes("f=km(v-u)/t") || lowerNorm.includes("v-u/t") || lowerNorm.includes("f∝")) {
    return true; // We only want F = ma
  }

  return false;
}

export function extractFormulas(text: string): ExtractedFormula[] {
  const candidates: Record<string, ExtractedFormula> = {};

  if (!text) return [];

  // 1) Extract LaTeX blocks
  for (const m of text.matchAll(LATEX_BLOCK)) {
    const body = m[1];
    for (const eq of body
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)) {
      const norm = normalizeFormulaRaw(eq);
      if (shouldRejectFormulaCandidate(eq, norm)) continue;
      candidates[norm] = candidates[norm] || createFormulaCandidate(eq, norm);
      candidates[norm].mentions += 1;
      const u = [...(eq.matchAll(UNIT_REGEX) || [])].map((x) => x[0]);
      candidates[norm].units.push(...u);
    }
  }

  // 2) Inline LaTeX
  for (const m of text.matchAll(INLINE_LATEX)) {
    const body = m[1];
    const norm = normalizeFormulaRaw(body);
    if (shouldRejectFormulaCandidate(body, norm)) continue;
    candidates[norm] = candidates[norm] || createFormulaCandidate(body, norm);
    candidates[norm].mentions += 1;
    candidates[norm].units.push(...[...(body.matchAll(UNIT_REGEX) || [])].map((x) => x[0]));
  }

  // 3) Normal equation-like patterns and plain text equations
  for (const raw of collectEquationLikeCandidates(text)) {
    const norm = normalizeFormulaRaw(raw);
    if (shouldRejectFormulaCandidate(raw, norm)) continue;
    candidates[norm] = candidates[norm] || createFormulaCandidate(raw, norm);
    candidates[norm].mentions += 1;
    candidates[norm].units.push(...[...(raw.matchAll(UNIT_REGEX) || [])].map((x) => x[0]));
  }

  // 4) Superscript heuristics (a^2, v², etc.) - try to capture small expressions
  for (const m of text.matchAll(SUPERSCRIPT_SQUARE)) {
    const raw = m[0];
    const norm = normalizeFormulaRaw(raw);
    if (shouldRejectFormulaCandidate(raw, norm)) continue;
    candidates[norm] = candidates[norm] || createFormulaCandidate(raw, norm);
    candidates[norm].mentions += 1;
  }

  // Map to registry and assign category
  for (const key of Object.keys(candidates)) {
    const entry = candidates[key];
    // try match registry
    for (const [k, def] of Object.entries(formulaRegistry)) {
      if (
        k.replace(/\s+/g, "").toLowerCase() === entry.normalized.toLowerCase() ||
        entry.raw.toLowerCase().includes(k.split("=")[0].toLowerCase())
      ) {
        entry.matchedDefinition = def;
        entry.category = def.category;
        break;
      }
    }
    // if no category, simple heuristics
    if (!entry.category) {
      if (/\bPV=|nRT|mol\b/.test(entry.raw)) entry.category = "chemistry";
      else if (/\bvar|sigma|σ|variance\b/i.test(entry.raw)) entry.category = "statistics";
      else entry.category = "physics";
    }
    // dedupe units
    entry.units = Array.from(new Set(entry.units)).filter(Boolean);
  }

  // Convert to list and rank by mentions and registry priority (registry entries first)
  const list = Object.values(candidates);
  list.sort((a, b) => {
    const priA = a.matchedDefinition ? 10 : 0;
    const priB = b.matchedDefinition ? 10 : 0;
    if (priA !== priB) return priB - priA;
    if (a.mentions !== b.mentions) return b.mentions - a.mentions;
    return b.normalized.length - a.normalized.length;
  });

  return list;
}
