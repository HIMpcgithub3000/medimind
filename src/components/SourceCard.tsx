import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Source } from "@/api/types";

export function SourceCard({
  source,
  rank,
  isExpanded,
  onToggle,
}: {
  source: Source;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const fill = Math.min(1, Math.max(0, source.score));
  return (
    <div className="overflow-hidden rounded-xl border border-cream-100 bg-white shadow-sm dark:border-teal-900 dark:bg-teal-950/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 w-full items-center gap-2 px-3 text-left transition hover:bg-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:hover:bg-teal-900/30"
        aria-expanded={isExpanded}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-cream-50">
          {rank}
        </span>
        <span className="flex-1 truncate text-sm text-teal-900 dark:text-cream-100" title={source.text_preview}>
          <span className="text-gray-500 dark:text-gray-400">
            [#{rank}
            {source.prompt_context_total != null && source.prompt_context_total > 0
              ? `/${source.prompt_context_total}`
              : ""}
            ]{" "}
          </span>
          {source.page != null && source.page > 0 ? (
            <span className="text-gray-500 dark:text-gray-400">p.{source.page} · </span>
          ) : null}
          {source.source.split("/").pop()}
          {source.chunk_chars != null && source.chunk_chars > 0 ? (
            <span className="text-gray-400 dark:text-gray-500"> · {source.chunk_chars.toLocaleString()} chars</span>
          ) : null}
        </span>
        <div className="h-2 w-20 overflow-hidden rounded-full bg-cream-100 dark:bg-teal-900">
          <div className="h-full bg-teal-600 transition-all" style={{ width: `${fill * 100}%` }} />
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition", isExpanded && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-cream-100 dark:border-teal-800"
          >
            <p className="border-b border-cream-100 px-3 py-2 text-[11px] leading-snug text-gray-600 dark:border-teal-800 dark:text-gray-300">
              <span className="font-medium text-teal-800 dark:text-teal-200">Prompt context block [{rank}]</span>
              {source.prompt_context_total != null && source.prompt_context_total > 0
                ? ` — same index as [${rank}] in the LLM prompt (CONTEXT).`
                : " — matches the numbered block in CONTEXT."}
              {source.chunk_chars != null && source.chunk_chars > 0 ? (
                <> Full chunk: {source.chunk_chars.toLocaleString()} characters.</>
              ) : null}
              {source.chunk_index != null && source.total_chunks != null && source.total_chunks > 0 ? (
                <>
                  {" "}
                  Indexed chunk {source.chunk_index + 1} of {source.total_chunks} for this file.
                </>
              ) : null}
            </p>
            <div className="max-h-64 overflow-y-auto p-3 font-mono text-xs text-teal-900 dark:text-cream-100">
              {source.text_preview}
            </div>
            <p className="px-3 pb-1 text-[10px] text-gray-500 dark:text-gray-400">
              Preview (first ~1,600 characters of the chunk; full size above).
            </p>
            <p className="px-3 pb-2 text-[10px] text-gray-500">{source.source}</p>
            <p className="px-3 pb-2 text-xs text-teal-600">Score: {(source.score * 100).toFixed(1)}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
