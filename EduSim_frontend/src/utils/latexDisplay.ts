const LATEX_COMMAND_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\\rightarrow/g, "→"],
  [/\\leftarrow/g, "←"],
  [/\\leftrightarrow/g, "↔"],
  [/\\theta/g, "θ"],
  [/\\alpha/g, "α"],
  [/\\beta/g, "β"],
  [/\\lambda/g, "λ"],
  [/\\pi/g, "π"],
  [/\\sigma/g, "σ"],
  [/\\mu/g, "μ"],
  [/\\cdot/g, "·"],
  [/\\times/g, "×"],
];

const SUBSCRIPT_DIGITS: Record<string, string> = {
  0: "₀",
  1: "₁",
  2: "₂",
  3: "₃",
  4: "₄",
  5: "₅",
  6: "₆",
  7: "₇",
  8: "₈",
  9: "₉",
};

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
};

function convertSubscriptContent(content: string) {
  const cleaned = content
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\/g, "")
    .trim();

  if (!cleaned) return "";
  if (/^[A-Za-z]+$/.test(cleaned)) return cleaned;
  if (/^[0-9]+$/.test(cleaned)) {
    return cleaned
      .split("")
      .map((digit) => SUBSCRIPT_DIGITS[digit] || digit)
      .join("");
  }

  return cleaned
    .split("")
    .map((char) => SUBSCRIPT_DIGITS[char] || char)
    .join("");
}

function convertSuperscriptContent(content: string) {
  const cleaned = content
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\/g, "")
    .trim();

  if (!cleaned) return "";
  if (/^[0-9]+$/.test(cleaned)) {
    return cleaned
      .split("")
      .map((digit) => SUPERSCRIPT_DIGITS[digit] || digit)
      .join("");
  }

  return cleaned;
}

function normalizeSpacing(value: string) {
  return value
    .replace(/\s*([=+\-→×÷/])\s*/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatLatexForDisplay(raw: string) {
  if (!raw) return "";

  let display = raw;

  display = display.replace(/\\left/g, "").replace(/\\right/g, "");
  display = display.replace(
    /\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
    (_match, numerator: string, denominator: string) => {
      return `${formatLatexForDisplay(numerator)} / ${formatLatexForDisplay(denominator)}`;
    },
  );
  display = display.replace(
    /([A-Za-z0-9])_\{([^{}]+)\}/g,
    (_match, base: string, subscript: string) => {
      return `${base}${convertSubscriptContent(subscript)}`;
    },
  );
  display = display.replace(
    /([A-Za-z0-9])\^\{([^{}]+)\}/g,
    (_match, base: string, superscript: string) => {
      return `${base}${convertSuperscriptContent(superscript)}`;
    },
  );

  for (const [pattern, replacement] of LATEX_COMMAND_REPLACEMENTS) {
    display = display.replace(pattern, replacement);
  }

  display = display.replace(/[{}]/g, "").replace(/\\/g, "").replace(/\$/g, "");

  return normalizeSpacing(display);
}
