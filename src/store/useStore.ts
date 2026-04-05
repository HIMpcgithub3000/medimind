import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EvalResult, Message, ResponseMeta, Source } from "@/api/types";

/** Tags must exist in `ollama list` (e.g. gemma3:12b / gemma3:4b). */
export type OllamaModelId = "gemma3:12b" | "gemma3:4b";

type IndexInfo = {
  numChunks: number;
  embeddingDim: number;
  dbBackend: string;
  chunkStrategy: string;
};
type SourceFile = { name: string; size: number; type: string };

interface SettingsSlice {
  dbBackend: "faiss" | "chroma";
  embeddingKey: "minilm" | "bge" | "mpnet";
  chunkStrategy: "fixed" | "sentence" | "semantic" | "by_page";
  chunkSize: number;
  overlap: number;
  topK: number;
  fetchK: number;
  templateId: 1 | 2 | 3 | 4;
  rerank: boolean;
  ollamaModel: OllamaModelId;
  darkMode: boolean;
  setSettings: (p: Partial<SettingsSlice>) => void;
}

interface SessionSlice {
  sessionId: string | null;
  sourceFile: SourceFile | null;
  indexInfo: IndexInfo | null;
  isIndexing: boolean;
  indexingProgress: number;
  setSession: (id: string, file: SourceFile, indexInfo: IndexInfo) => void;
  clearSession: () => void;
  setIndexing: (v: boolean, progress?: number) => void;
}

interface ChatSlice {
  messages: Message[];
  isGenerating: boolean;
  addMessage: (m: Message) => void;
  updateLastAssistantMessage: (patch: Partial<Message>) => void;
  clearMessages: () => void;
  setGenerating: (v: boolean) => void;
}

interface EvalSlice {
  evalJobId: string | null;
  evalStatus: "idle" | "running" | "complete" | "failed";
  evalResults: EvalResult[] | null;
  evalSummary: Record<string, number> | null;
  setEval: (p: Partial<EvalSlice>) => void;
}

interface UiSlice {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  health: { ok: boolean; ollama: boolean; sessions: number } | null;
  setHealth: (h: UiSlice["health"]) => void;
}

export type MediMindStore = SessionSlice & ChatSlice & SettingsSlice & EvalSlice & UiSlice;

const genId = () => crypto.randomUUID();

export const useStore = create<MediMindStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      sourceFile: null,
      indexInfo: null,
      isIndexing: false,
      indexingProgress: 0,
      setSession: (id, file, indexInfo) =>
        set({
          sessionId: id,
          sourceFile: file,
          indexInfo,
          isIndexing: false,
          indexingProgress: 100,
        }),
      clearSession: () =>
        set({
          sessionId: null,
          sourceFile: null,
          indexInfo: null,
          messages: [],
          evalJobId: null,
          evalStatus: "idle",
          evalResults: null,
          evalSummary: null,
        }),
      setIndexing: (v, progress = 0) => set({ isIndexing: v, indexingProgress: progress }),

      messages: [],
      isGenerating: false,
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      updateLastAssistantMessage: (patch) =>
        set((s) => {
          const msgs = [...s.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant") {
              msgs[i] = { ...msgs[i], ...patch };
              break;
            }
          }
          return { messages: msgs };
        }),
      clearMessages: () => set({ messages: [] }),
      setGenerating: (v) => set({ isGenerating: v }),

      dbBackend: "faiss",
      embeddingKey: "minilm",
      chunkStrategy: "by_page",
      chunkSize: 512,
      overlap: 64,
      topK: 6,
      fetchK: 24,
      templateId: 4,
      rerank: true,
      ollamaModel: "gemma3:12b",
      darkMode: false,
      setSettings: (p) => set(p as Partial<MediMindStore>),

      evalJobId: null,
      evalStatus: "idle",
      evalResults: null,
      evalSummary: null,
      setEval: (p) => set(p),

      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      health: null,
      setHealth: (h) => set({ health: h }),
    }),
    {
      name: "medimind-ui",
      merge: (persisted, current) => {
        const p = persisted as Partial<MediMindStore> | undefined;
        if (!p) return current;
        const db: SettingsSlice["dbBackend"] =
          p.dbBackend === "faiss" || p.dbBackend === "chroma" ? p.dbBackend : current.dbBackend;
        const emb: SettingsSlice["embeddingKey"] =
          p.embeddingKey === "minilm" || p.embeddingKey === "bge" || p.embeddingKey === "mpnet"
            ? p.embeddingKey
            : current.embeddingKey;
        const chunk: SettingsSlice["chunkStrategy"] =
          p.chunkStrategy === "fixed" ||
          p.chunkStrategy === "sentence" ||
          p.chunkStrategy === "semantic" ||
          p.chunkStrategy === "by_page"
            ? p.chunkStrategy
            : current.chunkStrategy;
        const rawOm = p.ollamaModel as string | undefined;
        let om: OllamaModelId =
          rawOm === "gemma3:12b" || rawOm === "gemma3:4b"
            ? rawOm
            : rawOm === "gemma3:7b" || rawOm === "qwen2.5:7b"
              ? "gemma3:4b"
              : current.ollamaModel;
        return {
          ...current,
          ...p,
          dbBackend: db,
          embeddingKey: emb,
          chunkStrategy: chunk,
          ollamaModel: om,
        };
      },
      partialize: (s) => ({
        sessionId: s.sessionId,
        sidebarOpen: s.sidebarOpen,
        dbBackend: s.dbBackend,
        embeddingKey: s.embeddingKey,
        chunkStrategy: s.chunkStrategy,
        chunkSize: s.chunkSize,
        overlap: s.overlap,
        topK: s.topK,
        fetchK: s.fetchK,
        templateId: s.templateId,
        rerank: s.rerank,
        ollamaModel: s.ollamaModel,
        darkMode: s.darkMode,
      }),
    }
  )
);

export { genId };
export type { Source, ResponseMeta };
