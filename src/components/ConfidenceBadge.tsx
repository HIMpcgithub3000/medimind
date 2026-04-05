import * as Tooltip from "@radix-ui/react-tooltip";
import { AlertCircle, Shield, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/api/types";

export function ConfidenceBadge({
  confidence,
  abstentionTriggered,
}: {
  confidence: Confidence;
  abstentionTriggered: boolean;
}) {
  if (abstentionTriggered) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-200">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Insufficient context
      </span>
    );
  }
  const Icon = confidence === "high" ? Shield : confidence === "medium" ? AlertCircle : XCircle;
  const styles =
    confidence === "high"
      ? "bg-teal-600 text-cream-50"
      : confidence === "medium"
        ? "bg-amber-400 text-amber-900"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200";
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            className={cn("inline-flex cursor-default items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", styles)}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {confidence} confidence
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="rounded-md bg-teal-900 px-2 py-1 text-xs text-cream-50 shadow-md" sideOffset={4}>
            Heuristic from retrieval top-1 score — not a clinical certainty.
            <Tooltip.Arrow className="fill-teal-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
