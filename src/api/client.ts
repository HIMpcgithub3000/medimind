import axios from "axios";
import toast from "react-hot-toast";
import { useStore } from "@/store/useStore";
import type {
  ChatResponse,
  ChatSettings,
  HealthResponse,
  IngestResponse,
  IngestSettings,
  SessionInfo,
  Source,
  ResponseMeta,
} from "@/api/types";

const api = axios.create({
  baseURL: "/api",
  timeout: 120_000,
});

api.interceptors.request.use((config) => {
  const sid = useStore.getState().sessionId;
  if (sid) config.headers["x-session-id"] = sid;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = String(err.response?.data?.detail || err.message || "Request failed");
    if (err.response?.status === 404 && msg.toLowerCase().includes("session")) {
      useStore.getState().clearSession();
      toast.error("Session expired. Please upload again.");
    }
    return Promise.reject(err);
  }
);

function ingestSettingsToFormData(file: File, s: IngestSettings): FormData {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("chunk_strategy", s.chunkStrategy);
  fd.append("chunk_size", String(s.chunkSize));
  fd.append("overlap", String(s.overlap));
  fd.append("embedding_key", s.embeddingKey);
  fd.append("db_backend", s.dbBackend);
  fd.append("template_id", String(s.templateId));
  fd.append("llm_backend", "ollama");
  fd.append("ollama_model", s.ollamaModel);
  fd.append("hf_model_key", "");
  fd.append("use_rerank", s.useRerank ? "true" : "false");
  return fd;
}

export async function ingestFile(file: File, settings: IngestSettings): Promise<IngestResponse> {
  const st = useStore.getState();
  st.setIndexing(true, 0);
  const iv = setInterval(() => {
    const p = useStore.getState().indexingProgress;
    if (p < 90) st.setIndexing(true, p + 3);
  }, 100);
  try {
    const { data } = await api.post<IngestResponse>("/ingest", ingestSettingsToFormData(file, settings), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    st.setIndexing(true, 100);
    return data;
  } finally {
    clearInterval(iv);
    st.setIndexing(false, 0);
  }
}

export async function chat(question: string, settings: ChatSettings, sessionId: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat", {
    session_id: sessionId,
    question,
    top_k: settings.topK,
    fetch_k: settings.fetchK,
    template_id: settings.templateId,
    rerank: settings.rerank,
    mmr: false,
  });
  return data;
}

export async function chatStream(
  question: string,
  settings: ChatSettings,
  sessionId: string,
  onSources: (sources: Source[]) => void,
  onToken: (token: string) => void,
  onDone: (meta: ResponseMeta) => void
): Promise<void> {
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(useStore.getState().sessionId ? { "x-session-id": useStore.getState().sessionId! } : {}),
    },
    body: JSON.stringify({
      session_id: sessionId,
      question,
      top_k: settings.topK,
      fetch_k: settings.fetchK,
      template_id: settings.templateId,
      rerank: settings.rerank,
      mmr: false,
    }),
  });
  if (!res.ok) {
    onDone({
      confidence: "low",
      abstention_triggered: true,
      citation_count: 0,
      retrieval_time_ms: 0,
      generation_time_ms: 0,
      total_time_ms: 0,
      trace_id: "",
      error: await res.text(),
    });
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) return;
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() || "";
    for (const block of parts) {
      const line = block.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      try {
        const ev = JSON.parse(json) as { type: string; sources?: Source[]; token?: string; meta?: ResponseMeta };
        if (ev.type === "sources" && ev.sources) onSources(ev.sources);
        else if (ev.type === "token" && ev.token) onToken(ev.token);
        else if (ev.type === "done" && ev.meta) onDone(ev.meta);
      } catch {
        /* ignore */
      }
    }
  }
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function getSession(sessionId: string): Promise<SessionInfo> {
  const { data } = await api.get<SessionInfo>(`/session/${sessionId}`);
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/session/${sessionId}`);
}

export async function runEvaluation(sessionId: string): Promise<{ job_id: string; status: string }> {
  const { data } = await api.post("/evaluate", { session_id: sessionId });
  return data as { job_id: string; status: string };
}

export async function getEvaluation(
  jobId: string
): Promise<{ status: string; results?: Record<string, unknown>[]; summary?: Record<string, number>; error?: string }> {
  const { data } = await api.get(`/evaluate/${jobId}`);
  return data;
}

