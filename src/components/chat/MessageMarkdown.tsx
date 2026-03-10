"use client";

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MessageMarkdownProps {
  content: string;
}

const components: Components = {
  p: ({ children }) => <span className="whitespace-pre-wrap">{children}</span>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => (
    <del className="text-[#72767d] line-through">{children}</del>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#00aff4] hover:underline"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="mt-1 block overflow-x-auto rounded bg-[#2b2d31] p-3 font-mono text-sm text-[#dcddde]">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-[#2b2d31] px-1 py-0.5 font-mono text-xs text-[#e8912d]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-1">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#4e5058] pl-3 text-[#8e9297]">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="ml-4 list-disc text-[#dcddde]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-4 list-decimal text-[#dcddde]">{children}</ol>
  ),
  li: ({ children }) => <li className="mt-0.5">{children}</li>,
};

const remarkPlugins = [remarkGfm];

function MessageMarkdownInner({
  content,
}: MessageMarkdownProps): React.ReactNode {
  const trimmed = useMemo(() => content.trim(), [content]);

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      components={components}
    >
      {trimmed}
    </ReactMarkdown>
  );
}

export const MessageMarkdown = memo(MessageMarkdownInner);
