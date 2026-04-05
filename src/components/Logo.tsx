import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const sizes = { sm: 32, md: 48, lg: 56 };

export function Logo({
  size = "md",
  showTagline = true,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2">
      <motion.svg
        width={s}
        height={s}
        viewBox="0 0 48 48"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="shrink-0"
        aria-hidden
      >
        <motion.path
          d="M4 28 L10 12 L16 30 L22 14 L28 32 L34 18 L40 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-teal-600 dark:text-teal-400"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </motion.svg>
      <div>
        <div className={cn("font-semibold text-teal-800 dark:text-teal-100", size === "sm" && "text-sm", size === "lg" && "text-xl")}>
          MediMind
        </div>
        {showTagline && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">by RAG</div>
        )}
      </div>
    </div>
  );
}
