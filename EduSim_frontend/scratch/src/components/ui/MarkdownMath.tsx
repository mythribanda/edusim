import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface MarkdownMathProps {
  content: string;
  className?: string;
}

export const MarkdownMath: React.FC<MarkdownMathProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => <p className="leading-7" {...props} />,
          a: ({ node, ...props }) => <a className="text-violet-400 hover:underline" {...props} />,
          code: ({ node, inline, ...props }: any) => 
            inline ? (
              <code className="bg-white/10 px-1 py-0.5 rounded text-sm font-mono text-violet-200" {...props} />
            ) : (
              <code className="block bg-black/30 p-4 rounded-xl text-sm font-mono text-violet-200 overflow-x-auto" {...props} />
            )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMath;
