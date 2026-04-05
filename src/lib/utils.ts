import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

export function scoreToColor(score: number): string {
  if (score >= 0.55) return "bg-teal-100 text-teal-900";
  if (score >= 0.35) return "bg-amber-400/30 text-amber-800 dark:text-amber-200";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
}
