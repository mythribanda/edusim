import React, { useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { BlockMath, InlineMath } from "@/components/math/Katex";
import {
  AlertTriangle, CheckCircle2, Lightbulb, ListChecks, Sparkles,
  Copy, BookOpen, Calculator, Beaker, Check, FunctionSquare,
  Zap, Info, Flag, Target, ShieldAlert, Variable, FlagTriangleRight, FileQuestion
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { FormulaCard } from "./FormulaCard";

type Density = "compact" | "regular" | "spacious";
type SectionKind =
  | "default" | "concept" | "definition" | "formula" | "given_values" | "example"
  | "solution" | "final_answer" | "note" | "takeaway" | "warning" | "tip";

type SectionBlock = {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  kind: SectionKind;
  body: string;
};

interface PremiumTutorMarkdownRendererProps {
  content: string;
  className?: string;
  density?: Density;
}

const SECTION_KIND_MATCHERS: Array<{ kind: SectionKind; patterns: RegExp[] }> = [
  { kind: "concept", patterns: [/key concepts?/i, /concepts?/i, /core ideas?/i, /principles?/i] },
  { kind: "definition", patterns: [/definitions?/i, /what is/i, /meaning/i] },
  { kind: "formula", patterns: [/formulas?/i, /equations?/i, /mathematics?/i, /expressions?/i] },
  { kind: "given_values", patterns: [/given values?/i, /given/i, /parameters?/i, /variables?/i] },
  { kind: "solution", patterns: [/step[- ]by[- ]step/i, /solution steps?/i, /solutions?/i, /steps?/i] },
  { kind: "final_answer", patterns: [/final answers?/i, /answers?/i, /results?/i, /conclusion/i] },
  { kind: "example", patterns: [/examples?/i, /illustrations?/i, /case studies?/i, /worked examples?/i] },
  { kind: "warning", patterns: [/common mistakes?/i, /mistakes?/i, /pitfalls?/i, /warnings?/i, /caution/i, /watch out/i] },
  { kind: "note", patterns: [/important notes?/i, /notes?/i] },
  { kind: "tip", patterns: [/tips?/i, /pro[- ]?tips?/i, /tricks?/i, /shortcuts?/i] },
  { kind: "takeaway", patterns: [/key takeaways?/i, /takeaways?/i, /tl;dr/i, /bottom line/i, /important points?/i, /summary/i] },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/["'`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
}

function detectSectionKind(title: string): SectionKind {
  for (const matcher of SECTION_KIND_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(title))) {
      return matcher.kind;
    }
  }
  return "default";
}

function splitIntoSections(content: string): SectionBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const sections: SectionBlock[] = [];
  let currentTitle = "";
  let currentLevel: 1 | 2 | 3 = 2;
  let currentBody: string[] = [];
  let currentKind: SectionKind = "default";

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (!currentTitle && !body) {
      currentBody = [];
      return;
    }
    sections.push({
      id: currentTitle ? slugify(currentTitle) : `body-${sections.length + 1}`,
      level: currentLevel,
      title: currentTitle,
      kind: currentKind,
      body,
    });
    currentBody = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentLevel = headingMatch[1].length as 1 | 2 | 3;
      currentTitle = headingMatch[2].trim();
      currentKind = detectSectionKind(currentTitle);
      continue;
    }
    currentBody.push(line);
  }

  flush();
  return sections.length > 0 ? sections : [{ id: "body-1", level: 2, title: "", kind: "default", body: content }];
}

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(" ");
  if (React.isValidElement(node)) return flattenText((node as any).props.children);
  return "";
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = flattenText(children);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-8 overflow-hidden rounded-[16px] border border-white/10 bg-[#0d1117] shadow-xl group">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleCopy}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white shadow-sm transition-colors flex items-center justify-center backdrop-blur-md"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="overflow-x-auto p-6 custom-scrollbar text-[14px] font-mono leading-[1.7]">
        {children}
      </div>
    </div>
  );
}

function renderMarkdownBody(body: string, isDark: boolean, sectionKind: SectionKind, isHero: boolean = false) {
  const components: Components & { math?: any; inlineMath?: any } = {
    h1: ({ children }) => (
      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight text-foreground/95">{children}</h1>
    ),
    h2: ({ children }) => (
      <div className="mt-3 mb-2 border-b border-white/10 pb-1.5">
        <h2 className="text-[1.35rem] font-bold tracking-wide text-foreground/95 uppercase">{children}</h2>
      </div>
    ),
    h3: ({ children }) => (
      <h3 className="mt-2.5 mb-1.5 text-[1.2rem] font-bold tracking-tight text-foreground/80">{children}</h3>
    ),
    p: ({ children }) => {
      if (sectionKind === "final_answer" || sectionKind === "takeaway") {
        return <p className="mb-1 text-[1.15rem] font-semibold leading-[1.7] text-white tracking-[0.01em] last:mb-0">{children}</p>;
      }
      if (isHero) {
        return <p className="mb-1.5 text-[1.2rem] leading-[1.7] text-foreground/70 tracking-[0.01em] font-light last:mb-0">{children}</p>;
      }
      return <p className="mb-1.5 text-[1.1rem] leading-[1.7] tracking-[0.01em] text-foreground/80 last:mb-0 font-light">{children}</p>;
    },
    strong: ({ children }) => <strong className="font-semibold text-foreground/95">{children}</strong>,
    a: ({ children, href }) => (
      <a href={href} className="font-medium text-violet-400 underline decoration-violet-400/40 underline-offset-4 transition-colors hover:decoration-violet-400">
        {children}
      </a>
    ),
    hr: () => <hr className="my-4 border-white/5" />,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-2 border-violet-500/50 pl-4 py-1 italic text-[1.1rem] leading-[1.7] text-foreground/60 tracking-[0.01em]">
        {children}
      </blockquote>
    ),
    ul: ({ children }) => {
      if (sectionKind === "given_values") {
        return <ul className="my-2.5 flex flex-wrap gap-2.5">{children}</ul>;
      }
      return <ul className="my-2 ml-2 space-y-1 custom-list text-[1.1rem] leading-[1.7] text-foreground/80 font-light tracking-[0.01em]">{children}</ul>;
    },
    ol: ({ children }) => {
      if (sectionKind === "solution") {
        return <ol className="my-3 space-y-2 solution-list">{children}</ol>;
      }
      return <ol className="my-2.5 ml-6 space-y-1 list-decimal text-[1.1rem] leading-[1.7] text-foreground/80 font-light tracking-[0.01em] marker:text-foreground/30">{children}</ol>;
    },
    li: ({ children }) => {
      if (sectionKind === "given_values") {
        return <li className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-[12px] text-[1rem] text-foreground/90 font-medium tracking-wide flex items-center shadow-sm whitespace-nowrap">{children}</li>;
      }
      return <li className="pl-2">{children}</li>;
    },
    table: ({ children }) => (
      <div className="my-8 overflow-hidden rounded-[16px] border border-white/5 bg-white/[0.02] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[1.05rem]">{children}</table>
        </div>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-white/[0.03] border-b border-white/5">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-white/[0.02]">{children}</tr>,
    th: ({ children }) => <th className="px-6 py-4 font-semibold text-foreground/90">{children}</th>,
    td: ({ children }) => <td className="px-6 py-4 text-foreground/70 font-light">{children}</td>,
    code: ({ inline, children }: any) => {
      if (inline) {
        return (
          <code className="rounded-[6px] border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[0.9em] font-medium text-foreground/90">
            {children}
          </code>
        );
      }
      return <code className="font-mono text-[14px] text-foreground/80">{children}</code>;
    },
    pre: ({ children }: any) => <CodeBlock>{children}</CodeBlock>,
    math: ({ children }: any) => (
      <BlockMath math={String(children).trim()} />
    ),
    inlineMath: ({ children }: any) => (
      <InlineMath math={String(children).trim()} />
    ),
  };

  const preprocessedBody = useMemo(() => {
    let newBody = body;
    newBody = newBody.replace(/a = v\.e \/ l\.m/g, 'a = \\frac{v \\cdot e}{l \\cdot m}');
    newBody = newBody.replace(/v\.e/g, 'v \\cdot e');
    newBody = newBody.replace(/l\.m/g, 'l \\cdot m');
    return newBody;
  }, [body]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      components={components}
    >
      {preprocessedBody}
    </ReactMarkdown>
  );
}

function SectionContent({ section, isDark, isLast, index }: { section: SectionBlock; isDark: boolean; isLast: boolean; index: number }) {
  let iconColor = "text-foreground/50";
  let Icon = null;
  let titleColor = "text-foreground/90";

  if (section.kind === "concept" || section.kind === "definition") {
    iconColor = "text-blue-400";
    Icon = Lightbulb;
  } else if (section.kind === "formula") {
    iconColor = "text-emerald-400";
    Icon = FunctionSquare;
  } else if (section.kind === "given_values") {
    iconColor = "text-purple-400";
    Icon = Variable;
  } else if (section.kind === "solution") {
    iconColor = "text-indigo-400";
    Icon = ListChecks;
  } else if (section.kind === "final_answer") {
    iconColor = "text-amber-400";
    titleColor = "text-amber-100";
    Icon = Target;
  } else if (section.kind === "takeaway") {
    iconColor = "text-rose-400";
    Icon = Zap;
  } else if (section.kind === "note" || section.kind === "tip") {
    iconColor = "text-sky-400";
    Icon = Info;
  } else if (section.kind === "warning") {
    iconColor = "text-red-400";
    titleColor = "text-red-100";
    Icon = ShieldAlert;
  } else if (section.kind === "example") {
    iconColor = "text-slate-400";
    Icon = BookOpen;
  } else if (section.kind === "default" && section.title) {
    iconColor = "text-violet-400";
    Icon = FlagTriangleRight;
  }

  // FORMULA SECTION — dedicated textbook reference card
  if (section.kind === "formula") {
    return (
      <div className="w-full relative animate-in fade-in slide-in-from-bottom-2 duration-500 my-2">
        {section.title && (
          <div className="mb-3 flex items-center gap-2">
            <FunctionSquare className="w-4 h-4 text-emerald-400/80" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-300/80">
              {section.title}
            </h2>
          </div>
        )}
        <FormulaCard body={section.body} sectionTitle={section.title} />
        {!isLast && <div className="mt-4 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />}
      </div>
    );
  }

  // HERO SECTION
  if (section.level === 1) {
    return (
      <div className="w-full relative animate-in fade-in slide-in-from-bottom-2 duration-500 mb-2.5 mt-1">

        <h1 className="text-[2.5rem] sm:text-[3rem] font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 mb-2">
          {section.title}
        </h1>
        <div className="w-full">
          {renderMarkdownBody(section.body, isDark, section.kind, true)}
        </div>
        {!isLast && <div className="mt-3 w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />}
      </div>
    );
  }

  // SUMMARY / TAKEAWAY BOX
  if (section.kind === "takeaway" || section.kind === "final_answer") {
    return (
      <div className="w-full relative animate-in fade-in slide-in-from-bottom-2 duration-500 my-3">
        <div className="py-4 px-6 rounded-[20px] bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20 shadow-[0_8px_30px_rgba(139,92,246,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 blur-[100px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />
          <div className="flex items-center gap-4 mb-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <Target className="w-5 h-5 text-violet-300" />
            </div>
            <h3 className="text-[1.35rem] font-bold tracking-tight text-violet-100">{section.title || "Key Takeaway"}</h3>
          </div>
          <div className="relative z-10">
            {renderMarkdownBody(section.body, isDark, section.kind)}
          </div>
        </div>
      </div>
    );
  }

  // EDUCATIONAL CALLOUTS (Notes, Tips, Warnings)
  if (section.kind === "note" || section.kind === "tip" || section.kind === "warning") {
    const isWarn = section.kind === "warning";
    return (
      <div className="w-full relative animate-in fade-in slide-in-from-bottom-2 duration-500 my-2.5">
        <div className={cn("py-4 px-5 rounded-[16px] border backdrop-blur-md",
          isWarn ? "bg-red-500/5 border-red-500/20" : "bg-sky-500/5 border-sky-500/20"
        )}>
          <div className="flex items-center gap-3 mb-1">
            {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
            <h3 className={cn("text-[1.15rem] font-bold tracking-tight", titleColor)}>
              {section.title || (isWarn ? 'Warning' : 'Quick Insight')}
            </h3>
          </div>
          <div className="w-full">
            {renderMarkdownBody(section.body, isDark, section.kind)}
          </div>
        </div>
        {!isLast && <div className="mt-3 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />}
      </div>
    );
  }

  // STANDARD SECTIONS
  return (
    <div className="w-full relative animate-in fade-in slide-in-from-bottom-2 duration-500 my-1">
      {section.title && (
        <div className="mb-2 border-b border-white/10 pb-1">
          <div className="flex items-center gap-3">
            {Icon && <Icon className={cn("w-[20px] h-[20px]", iconColor)} />}
            <h2 className={cn("text-[1.45rem] font-bold tracking-wide uppercase", titleColor)}>
              {section.title}
            </h2>
          </div>
        </div>
      )}

      {!section.title && Icon && section.kind !== "default" && (
        <div className="mb-1.5">
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      )}

      <div className="w-full">
        {renderMarkdownBody(section.body, isDark, section.kind)}
      </div>

      {!isLast && (
        <div className="my-3 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </div>
  );
}

export function PremiumTutorMarkdownRenderer({ content, className }: PremiumTutorMarkdownRendererProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const normalizedStr = useMemo(() => {
    if (content == null) return "";
    return String(content);
  }, [content]);

  const sections = useMemo(() => splitIntoSections(normalizedStr), [normalizedStr]);

  if (!normalizedStr.trim()) return null;

  return (
    <article className={cn(
      "w-full md:w-[95%] lg:w-[90%] max-w-[1500px] mx-auto premium-tutor-markdown relative",
      "bg-[#0a0f1c]/90 backdrop-blur-2xl border border-white/5",
      "rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.2)]",
      "pt-3 pb-4 px-4 sm:pt-4 sm:pb-5 sm:px-5 md:pt-4 md:pb-5 md:px-8",
      className
    )}>

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-tutor-markdown .katex-display {
          margin: 1.2rem 0;
          padding: 1.25rem 1rem;
          overflow-x: auto;
          overflow-y: hidden;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          text-align: center;
          font-size: 1.4em;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-tutor-markdown .katex-display:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        .premium-tutor-markdown .katex-display > .katex {
          white-space: nowrap;
        }
        .premium-tutor-markdown .katex {
          font-size: 1.15em;
          text-rendering: auto;
        }
        .premium-tutor-markdown .katex-inline {
          padding: 0.15em 0.4em;
          background: rgba(255,255,255, 0.04);
          border: 1px solid rgba(255,255,255, 0.05);
          border-radius: 8px;
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          font-size: 1.05em;
        }
        .premium-tutor-markdown .solution-list {
          list-style-type: none;
          counter-reset: step;
        }
        .premium-tutor-markdown .solution-list > li {
          position: relative;
          padding-left: 4rem;
          margin-bottom: 0.8rem;
        }
        .premium-tutor-markdown .solution-list > li::before {
          content: counter(step);
          counter-increment: step;
          position: absolute;
          left: 0;
          top: 0.15rem;
          display: flex;
          height: 2.25rem;
          width: 2.25rem;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.95rem;
        }
        .premium-tutor-markdown .custom-list {
          list-style: none;
          padding-left: 0;
        }
        .premium-tutor-markdown .custom-list > li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 0.35rem;
        }
        .premium-tutor-markdown .custom-list > li::before {
          content: '✓';
          position: absolute;
          left: 0;
          top: 0.1rem;
          color: rgba(167, 139, 250, 0.9);
          font-weight: bold;
        }
      `}} />

      <div className="flex items-center gap-3 mb-2 pb-1.5 border-b border-white/5 w-full">
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] shadow-lg shadow-violet-500/30">
          <span className="text-white text-sm font-bold tracking-wider">AI</span>
        </div>
        <span className="text-sm font-bold text-violet-300/80 uppercase tracking-widest">AI Assistant</span>
      </div>

      <div className="flex flex-col w-full">
        {sections.map((section, index) => (
          <SectionContent
            key={section.id}
            section={section}
            isDark={isDark}
            isLast={index === sections.length - 1}
            index={index}
          />
        ))}
      </div>
    </article>
  );
}
