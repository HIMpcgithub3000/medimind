import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "What are the side effects of aspirin?",
  "How is Type 2 diabetes diagnosed?",
  "What is the Glasgow Coma Scale?",
  "What vaccines are recommended for adults?",
];

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Ask about your document…",
}: {
  onSend: (q: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [val, setVal] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ta.current?.style.setProperty("height", "auto");
    ta.current?.style.setProperty("height", `${Math.min(ta.current.scrollHeight, 120)}px`);
  }, [val]);

  const send = () => {
    const q = val.trim();
    if (!q || disabled) return;
    setVal("");
    onSend(q);
  };

  return (
    <div className="border-t border-cream-100 bg-cream-50/90 p-4 backdrop-blur dark:border-teal-900 dark:bg-teal-950/90">
      <div className="mx-auto max-w-3xl">
        <div className="flex gap-2 rounded-2xl border border-cream-100 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-teal-600 dark:border-teal-800 dark:bg-teal-950">
          <textarea
            ref={ta}
            rows={1}
            maxLength={500}
            value={val}
            disabled={disabled}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={placeholder}
            className="max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-teal-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed dark:text-cream-100"
            aria-label="Chat message"
          />
          <button
            type="button"
            onClick={send}
            disabled={disabled || !val.trim()}
            aria-label="Send message"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
              val.trim() && !disabled ? "bg-teal-600 text-cream-50 hover:bg-teal-800" : "bg-gray-200 text-gray-400 dark:bg-teal-900"
            )}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
        {val.length >= 200 && (
          <p className="mt-1 text-right text-xs text-gray-500">
            {val.length}/500
          </p>
        )}
        <motion.div
          className="mt-3 flex flex-wrap gap-2"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {EXAMPLES.map((ex) => (
            <motion.button
              key={ex}
              type="button"
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              onClick={() => setVal(ex)}
              disabled={disabled}
              className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs text-teal-800 hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-teal-700 dark:bg-teal-900/50 dark:text-cream-100"
            >
              {ex.slice(0, 42)}…
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
