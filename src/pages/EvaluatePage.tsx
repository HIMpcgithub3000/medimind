import { useState } from "react";
import { PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/store/useStore";
import { runEvaluation, getEvaluation } from "@/api/client";
import type { EvalResult } from "@/api/types";

type SortKey = "rouge1" | "faithfulness" | "latency" | "question";

function totalLatencyMs(r: EvalResult): number {
  return Number(r.retrieval_time_ms ?? 0) + Number(r.generation_time_ms ?? 0);
}

export function EvaluatePage() {
  const st = useStore();
  const [sortKey, setSortKey] = useState<SortKey>("rouge1");
  const [asc, setAsc] = useState(false);

  const run = async () => {
    if (!st.sessionId) {
      toast.error("Index a document first");
      return;
    }
    st.setEval({ evalStatus: "running", evalResults: null, evalSummary: null });
    try {
      const { job_id } = await runEvaluation(st.sessionId);
      st.setEval({ evalJobId: job_id });

      const tick = async (): Promise<boolean> => {
        const r = await getEvaluation(job_id);
        if (r.status === "complete" && r.results) {
          st.setEval({
            evalStatus: "complete",
            evalResults: r.results as EvalResult[],
            evalSummary: r.summary || null,
          });
          return true;
        }
        if (r.status === "failed") {
          st.setEval({ evalStatus: "failed" });
          toast.error(r.error || "Eval failed");
          return true;
        }
        return false;
      };

      if (await tick()) return;
      const poll = setInterval(async () => {
        if (await tick()) clearInterval(poll);
      }, 3000);
    } catch (e) {
      st.setEval({ evalStatus: "failed" });
      toast.error(String(e));
    }
  };

  const onHeaderClick = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setAsc((a) => !a);
        return prev;
      }
      setAsc(false);
      return key;
    });
  };

  let rows = st.evalResults ? [...st.evalResults] : [];
  rows.sort((a, b) => {
    if (sortKey === "question") {
      const cmp = String(a.question ?? "").localeCompare(String(b.question ?? ""));
      return asc ? cmp : -cmp;
    }
    const av = sortKey === "latency" ? totalLatencyMs(a) : Number(a[sortKey] ?? 0);
    const bv = sortKey === "latency" ? totalLatencyMs(b) : Number(b[sortKey] ?? 0);
    return asc ? av - bv : bv - av;
  });

  const exportCsv = () => {
    if (!st.evalResults?.length) return;
    const cols = Object.keys(st.evalResults[0]);
    const csv = [cols.join(","), ...st.evalResults.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "medimind-eval.csv";
    a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 overflow-y-auto p-4 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-teal-900 dark:text-cream-100">Benchmark evaluation</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Ten fixed medical FAQ pairs vs your indexed corpus (reference text may not match policy PDFs).</p>
      </div>

      <div className="rounded-xl border border-cream-100 bg-white p-4 shadow-sm dark:border-teal-800 dark:bg-teal-950/60">
        <p className="text-sm text-teal-800 dark:text-cream-100">
          Embedding: {st.embeddingKey} · DB: {st.dbBackend} · Template: {st.templateId} · Ollama: {st.ollamaModel}
        </p>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={!st.sessionId || st.evalStatus === "running"}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-cream-50 hover:bg-teal-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      >
        <PlayCircle className="h-5 w-5" />
        {st.evalStatus === "running" ? "Running…" : "Run 10-question benchmark"}
      </button>

      {st.evalSummary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(st.evalSummary).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-cream-100 bg-white p-3 dark:border-teal-800 dark:bg-teal-950/60">
              <p className="text-xs text-gray-500">{k}</p>
              <p className="text-lg font-semibold text-teal-800 dark:text-cream-100">{typeof v === "number" ? v.toFixed(3) : v}</p>
            </div>
          ))}
        </div>
      )}

      {st.evalResults && (
        <>
          <button type="button" onClick={exportCsv} className="text-sm text-teal-600 underline">
            Export CSV
          </button>
          <div className="overflow-x-auto rounded-xl border border-cream-100 dark:border-teal-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50 dark:border-teal-800 dark:bg-teal-900/40">
                  <th scope="col" className="px-3 py-2">
                    #
                  </th>
                  <ThSort label="Question" active={sortKey === "question"} asc={asc} onClick={() => onHeaderClick("question")} />
                  <ThSort label="ROUGE-1" active={sortKey === "rouge1"} asc={asc} onClick={() => onHeaderClick("rouge1")} />
                  <ThSort label="Faithfulness" active={sortKey === "faithfulness"} asc={asc} onClick={() => onHeaderClick("faithfulness")} />
                  <ThSort label="Latency (ms)" active={sortKey === "latency"} asc={asc} onClick={() => onHeaderClick("latency")} />
                  <th scope="col" className="px-3 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const rg = Number(r.rouge1 ?? 0);
                  return (
                    <tr key={i} className="border-b border-cream-50 hover:bg-teal-50/50 dark:border-teal-900 dark:hover:bg-teal-900/30">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="max-w-[200px] truncate px-3 py-2" title={String(r.question ?? "")}>
                        {String(r.question ?? "").slice(0, 60)}
                        {(String(r.question ?? "").length > 60 ? "…" : "")}
                      </td>
                      <td className={cnCell(rg)}>{rg.toFixed(2)}</td>
                      <td className={cnFaith(Number(r.faithfulness ?? 0))}>{Number(r.faithfulness ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2">{Math.round(totalLatencyMs(r))}</td>
                      <td className="px-3 py-2">ok</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ThSort({
  label,
  active,
  asc,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
}) {
  return (
    <th scope="col" className="px-3 py-2">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-1 text-left font-semibold text-teal-900 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-cream-100"
      >
        {label}
        <span className="text-xs font-normal text-gray-500">{active ? (asc ? "↑" : "↓") : ""}</span>
      </button>
    </th>
  );
}

function cnCell(rouge: number) {
  const cls = rouge >= 0.4 ? "bg-green-100" : rouge >= 0.2 ? "bg-amber-100" : "bg-red-100";
  return `px-3 py-2 ${cls} dark:opacity-80`;
}

function cnFaith(f: number) {
  const cls = f >= 0.5 ? "bg-green-50" : f >= 0.25 ? "bg-amber-50" : "bg-red-50";
  return `px-3 py-2 ${cls} dark:opacity-80`;
}
