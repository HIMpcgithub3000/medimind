import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";
import { ChevronDown, CloudUpload, Check, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import { Logo } from "./Logo";
import { Navigation } from "./Navigation";
import { ingestFile, getHealth } from "@/api/client";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const SelTrigger =
  "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-cream-200 bg-white px-3 text-sm text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-teal-800 dark:bg-teal-950 dark:text-cream-100";

const LABEL = "mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-teal-800 dark:text-teal-200";

const DB_LABEL: Record<string, string> = { faiss: "FAISS", chroma: "ChromaDB" };
const EMB_LABEL: Record<string, string> = {
  minilm: "MiniLM-L6 (384d)",
  bge: "BGE-small (384d)",
  mpnet: "MPNet (768d)",
};
const CHUNK_LABEL: Record<string, string> = {
  fixed: "Fixed size",
  sentence: "Sentence blocks",
  semantic: "Semantic merge",
  by_page: "By PDF page",
};
const TEMPLATE_LABEL: Record<string, string> = {
  "1": "1 — Conservative",
  "2": "2 — Educational",
  "3": "3 — Structured",
  "4": "4 — Strict document-only",
};

const OLLAMA_MODEL_LABEL: Record<string, string> = {
  "gemma3:12b": "gemma3:12b (larger)",
  "gemma3:4b": "gemma3:4b (smaller, faster)",
};

/** Radix Select needs Viewport + popper so menus render above main content and receive clicks. */
function SelectMenu({ children }: { children: React.ReactNode }) {
  return (
    <Select.Portal>
      <Select.Content
        position="popper"
        side="bottom"
        sideOffset={6}
        align="start"
        collisionPadding={16}
        className="z-[400] max-h-[min(320px,70vh)] overflow-hidden rounded-lg border border-cream-200 bg-white shadow-xl dark:border-teal-800 dark:bg-teal-950"
      >
        <Select.Viewport className="p-1">{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  );
}

const itemClass =
  "relative flex cursor-pointer select-none rounded-md px-3 py-2 text-sm text-teal-900 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-teal-50 data-[state=checked]:font-medium dark:text-cream-100 dark:data-[highlighted]:bg-teal-900/60";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const st = useStore();
  const setHealth = useStore((s) => s.setHealth);
  const [file, setFile] = useState<File | null>(null);
  const [secOpen, setSecOpen] = useState({ doc: true, ret: true, gen: true });

  // Poll /api/health with exponential backoff when the API is down so Vite’s proxy log is not spammed.
  const apiWarned = useRef(false);
  useEffect(() => {
    let cancelled = false;
    let delayMs = 30_000;

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const loop = async () => {
      while (!cancelled) {
        try {
          const h = await getHealth();
          if (cancelled) return;
          setHealth({ ok: true, ollama: h.ollama_reachable, sessions: h.active_sessions });
          delayMs = 30_000;
          apiWarned.current = false;
        } catch {
          if (cancelled) return;
          setHealth({ ok: false, ollama: false, sessions: 0 });
          if (!apiWarned.current) {
            toast.error("API unreachable. Start: uvicorn api.main:app --port 8000");
            apiWarned.current = true;
          }
          delayMs = delayMs >= 60_000 ? Math.min(delayMs * 2, 120_000) : 60_000;
        }
        await sleep(delayMs);
      }
    };

    void loop();
    return () => {
      cancelled = true;
    };
  }, [setHealth]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"], "text/markdown": [".md"] },
    maxSize: 50 * 1024 * 1024,
  });

  const doIndex = async () => {
    if (!file) return;
    try {
      const ingestSettings = {
        chunkStrategy: st.chunkStrategy,
        chunkSize: st.chunkSize,
        overlap: st.overlap,
        embeddingKey: st.embeddingKey,
        dbBackend: st.dbBackend,
        templateId: st.templateId,
        ollamaModel: st.ollamaModel,
        useRerank: st.rerank,
      };
      const r = await ingestFile(file, ingestSettings);
      st.setSession(
        r.session_id,
        { name: file.name, size: file.size, type: file.type },
        {
          numChunks: r.num_chunks,
          embeddingDim: r.embedding_dim,
          dbBackend: st.dbBackend,
          chunkStrategy: r.chunk_strategy,
        }
      );
      st.clearMessages();
      setFile(null);
      toast.success("Document indexed");
      onClose();
    } catch (e: unknown) {
      toast.error(String((e as Error).message || e));
    }
  };

  const sidebarBody = (
    <div className="flex h-full flex-col bg-cream-50 dark:bg-teal-950">
      <div className="border-b border-cream-100 p-4 dark:border-teal-800">
        <Logo size="md" />
        <p className="mt-1 text-xs text-teal-700 dark:text-teal-300">Evidence-grounded answers from your medical documents</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <Section title="Document" open={secOpen.doc} onToggle={() => setSecOpen((s) => ({ ...s, doc: !s.doc }))}>
          {!st.sessionId ? (
            <div
              {...getRootProps()}
              className={cn(
                "cursor-pointer rounded-xl border-2 border-dashed border-teal-200 bg-cream-50 p-6 text-center transition hover:scale-[1.01] hover:border-teal-400 dark:border-teal-700 dark:bg-teal-900/30",
                isDragActive && "border-teal-600 bg-teal-50 dark:bg-teal-900/50"
              )}
            >
              <input {...getInputProps()} />
              <CloudUpload className="mx-auto h-10 w-10 text-teal-600" />
              <p className="mt-2 text-sm text-teal-800 dark:text-cream-100">Drop PDF / TXT / MD (max 50MB)</p>
              {file && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs">{file.name}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      doIndex();
                    }}
                    className="w-full rounded-lg bg-teal-600 py-2 text-sm font-medium text-cream-50 hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    Index document
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-teal-200 bg-white p-3 dark:border-teal-800 dark:bg-teal-900/40">
              <div className="flex items-center gap-2 text-sm text-teal-800 dark:text-cream-100">
                <Check className="h-4 w-4 text-teal-600" />
                {st.sourceFile?.name}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {st.indexInfo?.numChunks} chunks · {st.indexInfo?.embeddingDim}d · {st.indexInfo?.dbBackend}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  st.clearSession();
                }}
                className="mt-2 w-full rounded-lg border border-teal-300 py-1 text-xs text-teal-800 dark:border-teal-600 dark:text-cream-100"
              >
                Replace document
              </button>
            </div>
          )}
          {st.isIndexing && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-teal-900">
              <div className="h-full bg-teal-600 transition-all" style={{ width: `${st.indexingProgress}%` }} />
            </div>
          )}
        </Section>

        <Section title="Retrieval" open={secOpen.ret} onToggle={() => setSecOpen((s) => ({ ...s, ret: !s.ret }))}>
          <label className={LABEL}>Vector database</label>
          <Select.Root value={st.dbBackend} onValueChange={(v) => st.setSettings({ dbBackend: v as "faiss" | "chroma" })}>
            <Select.Trigger className={SelTrigger} aria-label="Vector database">
              <Select.Value>{DB_LABEL[st.dbBackend] ?? st.dbBackend}</Select.Value>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Select.Trigger>
            <SelectMenu>
              <Select.Item value="faiss" className={itemClass}>
                FAISS
              </Select.Item>
              <Select.Item value="chroma" className={itemClass}>
                ChromaDB
              </Select.Item>
            </SelectMenu>
          </Select.Root>

          <label className={cn(LABEL, "mt-2")}>Embeddings</label>
          <Select.Root value={st.embeddingKey} onValueChange={(v) => st.setSettings({ embeddingKey: v as "minilm" | "bge" | "mpnet" })}>
            <Select.Trigger className={SelTrigger} aria-label="Embedding model">
              <Select.Value>{EMB_LABEL[st.embeddingKey] ?? st.embeddingKey}</Select.Value>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Select.Trigger>
            <SelectMenu>
              <Select.Item value="minilm" className={itemClass}>
                MiniLM-L6 (384d)
              </Select.Item>
              <Select.Item value="bge" className={itemClass}>
                BGE-small (384d)
              </Select.Item>
              <Select.Item value="mpnet" className={itemClass}>
                MPNet (768d)
              </Select.Item>
            </SelectMenu>
          </Select.Root>

          <label className={cn(LABEL, "mt-2")}>Chunking</label>
          <Select.Root value={st.chunkStrategy} onValueChange={(v) => st.setSettings({ chunkStrategy: v as "fixed" | "sentence" | "semantic" | "by_page" })}>
            <Select.Trigger className={SelTrigger} aria-label="Chunking strategy">
              <Select.Value>{CHUNK_LABEL[st.chunkStrategy] ?? st.chunkStrategy}</Select.Value>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Select.Trigger>
            <SelectMenu>
              <Select.Item value="fixed" className={itemClass}>
                Fixed size
              </Select.Item>
              <Select.Item value="sentence" className={itemClass}>
                Sentence blocks
              </Select.Item>
              <Select.Item value="semantic" className={itemClass}>
                Semantic merge
              </Select.Item>
              <Select.Item value="by_page" className={itemClass}>
                By PDF page
              </Select.Item>
            </SelectMenu>
          </Select.Root>

          {st.chunkStrategy === "fixed" && (
            <div className="mt-2 w-full min-w-0 space-y-3">
              <div className="w-full min-w-0">
                <label className="text-xs text-gray-600 dark:text-gray-400">Chunk size: {st.chunkSize}</label>
                <Slider.Root
                  value={[st.chunkSize]}
                  min={128}
                  max={1024}
                  step={128}
                  onValueChange={([v]) => st.setSettings({ chunkSize: v })}
                  className="relative flex h-9 w-full min-w-0 touch-none select-none items-center"
                >
                  <Slider.Track className="relative h-2 w-full grow rounded-full bg-cream-200 dark:bg-teal-900">
                    <Slider.Range className="absolute h-full rounded-full bg-teal-600" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block h-5 w-5 cursor-grab rounded-full border-2 border-teal-600 bg-white shadow-md focus:outline-none active:cursor-grabbing"
                    aria-label="Chunk size"
                  />
                </Slider.Root>
              </div>
              <div className="w-full min-w-0">
                <label className="text-xs text-gray-600 dark:text-gray-400">Overlap: {st.overlap}</label>
                <Slider.Root
                  value={[st.overlap]}
                  min={0}
                  max={256}
                  step={32}
                  onValueChange={([v]) => st.setSettings({ overlap: v })}
                  className="relative flex h-9 w-full min-w-0 touch-none select-none items-center"
                >
                  <Slider.Track className="relative h-2 w-full grow rounded-full bg-cream-200 dark:bg-teal-900">
                    <Slider.Range className="absolute h-full rounded-full bg-teal-600" />
                  </Slider.Track>
                  <Slider.Thumb className="block h-5 w-5 cursor-grab rounded-full border-2 border-teal-600 bg-white shadow-md focus:outline-none" aria-label="Overlap" />
                </Slider.Root>
              </div>
            </div>
          )}

          <div className="mt-3 w-full min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-teal-900 dark:text-cream-100" htmlFor="topk-input">
                Top-K
              </label>
              <input
                id="topk-input"
                type="number"
                min={1}
                max={10}
                value={st.topK}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isNaN(n)) return;
                  st.setSettings({ topK: Math.min(10, Math.max(1, Math.round(n))) });
                }}
                className="w-14 rounded-md border border-cream-200 bg-white px-2 py-1 text-right text-sm text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-teal-700 dark:bg-teal-900 dark:text-cream-100"
              />
            </div>
            <Slider.Root
              value={[st.topK]}
              min={1}
              max={10}
              step={1}
              onValueChange={([v]) => st.setSettings({ topK: v })}
              className="relative flex h-9 w-full min-w-0 touch-none select-none items-center"
            >
              <Slider.Track className="relative h-2 w-full grow rounded-full bg-cream-200 dark:bg-teal-900">
                <Slider.Range className="absolute h-full rounded-full bg-teal-600" />
              </Slider.Track>
              <Slider.Thumb
                className="block h-5 w-5 cursor-grab rounded-full border-2 border-teal-600 bg-white shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                aria-label="Top-K slider"
              />
            </Slider.Root>
          </div>

          <div className="mt-3 w-full min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-teal-900 dark:text-cream-100" htmlFor="fetchk-input">
                Fetch-K
              </label>
              <input
                id="fetchk-input"
                type="number"
                min={5}
                max={40}
                value={st.fetchK}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isNaN(n)) return;
                  st.setSettings({ fetchK: Math.min(40, Math.max(5, Math.round(n))) });
                }}
                className="w-14 rounded-md border border-cream-200 bg-white px-2 py-1 text-right text-sm text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-teal-700 dark:bg-teal-900 dark:text-cream-100"
              />
            </div>
            <Slider.Root
              value={[st.fetchK]}
              min={5}
              max={40}
              step={1}
              onValueChange={([v]) => st.setSettings({ fetchK: v })}
              className="relative flex h-9 w-full min-w-0 touch-none select-none items-center"
            >
              <Slider.Track className="relative h-2 w-full grow rounded-full bg-cream-200 dark:bg-teal-900">
                <Slider.Range className="absolute h-full rounded-full bg-teal-600" />
              </Slider.Track>
              <Slider.Thumb
                className="block h-5 w-5 cursor-grab rounded-full border-2 border-teal-600 bg-white shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                aria-label="Fetch-K slider"
              />
            </Slider.Root>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-teal-900 dark:text-cream-100">Cross-encoder rerank</span>
            <Switch.Root
              checked={st.rerank}
              onCheckedChange={(v) => st.setSettings({ rerank: v })}
              className="h-5 w-9 shrink-0 rounded-full border-0 bg-cream-200 outline-none ring-0 data-[state=checked]:bg-teal-600 dark:bg-teal-800 dark:data-[state=checked]:bg-teal-600"
            >
              <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition will-change-transform data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-gray-500 dark:text-gray-400">
            Reorders retrieved chunks with a cross-encoder. Applied when you <strong>index</strong> the document (re-index after changing).
          </p>
        </Section>

        <Section title="Generation" open={secOpen.gen} onToggle={() => setSecOpen((s) => ({ ...s, gen: !s.gen }))}>
          <label className={LABEL}>Prompt template</label>
          <Select.Root value={String(st.templateId)} onValueChange={(v) => st.setSettings({ templateId: Number(v) as 1 | 2 | 3 | 4 })}>
            <Select.Trigger className={SelTrigger} aria-label="Prompt template">
              <Select.Value>{TEMPLATE_LABEL[String(st.templateId)] ?? `Template ${st.templateId}`}</Select.Value>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Select.Trigger>
            <SelectMenu>
              <Select.Item value="4" className={itemClass}>
                4 — Strict document-only
              </Select.Item>
              <Select.Item value="1" className={itemClass}>
                1 — Conservative
              </Select.Item>
              <Select.Item value="2" className={itemClass}>
                2 — Educational
              </Select.Item>
              <Select.Item value="3" className={itemClass}>
                3 — Structured
              </Select.Item>
            </SelectMenu>
          </Select.Root>

          <label className={cn(LABEL, "mt-2")}>Ollama model</label>
          <Select.Root
            value={st.ollamaModel}
            onValueChange={(v) => st.setSettings({ ollamaModel: v as "gemma3:12b" | "gemma3:4b" })}
          >
            <Select.Trigger className={SelTrigger} aria-label="Ollama model">
              <Select.Value>{OLLAMA_MODEL_LABEL[st.ollamaModel] ?? st.ollamaModel}</Select.Value>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Select.Trigger>
            <SelectMenu>
              <Select.Item value="gemma3:12b" className={itemClass}>
                gemma3:12b
              </Select.Item>
              <Select.Item value="gemma3:4b" className={itemClass}>
                gemma3:4b
              </Select.Item>
            </SelectMenu>
          </Select.Root>
          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            Install each tag once:{" "}
            <code className="text-teal-700 dark:text-teal-300">ollama pull gemma3:12b</code> or{" "}
            <code className="text-teal-700 dark:text-teal-300">ollama pull gemma3:4b</code> — then confirm with{" "}
            <code className="text-teal-700 dark:text-teal-300">ollama list</code>.
          </p>
        </Section>
      </div>

      <div className="border-t border-cream-100 p-3 text-xs dark:border-teal-800">
        <Navigation />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Dark</span>
          <button
            type="button"
            onClick={() => {
              const d = !st.darkMode;
              st.setSettings({ darkMode: d });
              document.documentElement.classList.toggle("dark", d);
            }}
            className="flex items-center gap-1 rounded-lg border border-cream-200 px-2 py-1 dark:border-teal-800"
            aria-label="Toggle dark mode"
          >
            {st.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 space-y-1">
          <p className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", st.health?.ok ? "bg-teal-500" : "bg-red-500")} />
            API
          </p>
          <p className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", st.health?.ollama ? "bg-teal-500" : "bg-red-500")} />
            Ollama
          </p>
        </div>
        <p className="mt-2 text-[10px] text-gray-500">MediMind v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="relative z-30 hidden h-screen w-[280px] shrink-0 border-r border-cream-100 dark:border-teal-800 md:block">
        {sidebarBody}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close overlay" onClick={onClose} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="absolute left-0 top-0 h-full w-[280px] border-r border-cream-100 bg-cream-50 shadow-xl dark:border-teal-800 dark:bg-teal-950">
              {sidebarBody}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="mb-3 rounded-xl border border-cream-100 bg-white/50 dark:border-teal-800 dark:bg-teal-900/20">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-teal-800 dark:text-cream-100">
        {title}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="w-full min-w-0 overflow-hidden px-3 pb-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
