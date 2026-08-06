import React from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

const renderMath = (math: string, displayMode: boolean) => {
    try {
        const html = katex.renderToString(math, {
            displayMode,
            throwOnError: false,
            strict: "ignore",
        });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
        return <span className="font-mono text-sm text-indigo-300">{math}</span>;
    }
};

export const BlockMath = ({ math }: { math: string }) => renderMath(math, true);
export const InlineMath = ({ math }: { math: string }) => renderMath(math, false);
