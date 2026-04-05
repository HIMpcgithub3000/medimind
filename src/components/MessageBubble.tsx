import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourceCard } from "./SourceCard";
import { cn, formatMs } from "@/lib/utils";
import type { Message } from "@/api/types";

export function MessageBubble({ message }: { message: Message }) {
  const [openSrc, setOpenSrc] = useState<number | null>(null);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-600 px-4 py-2 text-cream-50 shadow-sm">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
      role="article"
    >
      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-teal-900 shadow-md dark:bg-teal-950/80 dark:text-cream-100">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              strong: ({ children }) => {
                const t = String(children);
                if (/^\[\d+\]$/.test(t)) {
                  return <strong className="text-amber-600 dark:text-amber-400">{children}</strong>;
                }
                return <strong>{children}</strong>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.isStreaming && <span className="ml-0.5 inline-block animate-pulse text-teal-600">|</span>}
        {message.meta && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <ConfidenceBadge confidence={message.meta.confidence} abstentionTriggered={message.meta.abstention_triggered} />
            <span>
              {formatMs(message.meta.retrieval_time_ms)} · {formatMs(message.meta.generation_time_ms)}
            </span>
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <details className="mt-3 border-t border-cream-100 pt-2 dark:border-teal-800">
            <summary className="cursor-pointer text-sm font-medium text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded">
              Sources ({message.sources.length}) — CONTEXT [1]–[{message.sources.length}] in prompt
            </summary>
            <div className="mt-2 space-y-2">
              <AnimatePresence>
                {message.sources.map((s) => (
                  <SourceCard
                    key={s.rank}
                    source={s}
                    rank={s.rank}
                    isExpanded={openSrc === s.rank}
                    onToggle={() => setOpenSrc(openSrc === s.rank ? null : s.rank)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </details>
        )}
      </div>
    </motion.div>
  );
}
