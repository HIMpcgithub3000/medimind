import { motion } from "framer-motion";

/** Shown below the user’s message while waiting for the assistant’s first tokens. */
export function ThinkingGlow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end pr-1"
      role="status"
      aria-live="polite"
      aria-label="MediMind is generating a response"
    >
      <span className="text-sm font-medium text-teal-600 animate-thinking-glow dark:text-teal-300">
        MediMind is thinking
        <span className="inline-flex">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce [animation-delay:120ms]">.</span>
          <span className="animate-bounce [animation-delay:240ms]">.</span>
        </span>
      </span>
    </motion.div>
  );
}
