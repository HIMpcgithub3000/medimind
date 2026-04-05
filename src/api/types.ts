export type Confidence = "high" | "medium" | "low";

export interface Source {
  rank: number;
  text_preview: string;
  source: string;
  score: number;
  /** 1-based PDF page when the backend had page metadata */
  page?: number | null;
  /** Full chunk length in characters (same text as in LLM context) */
  chunk_chars?: number;
  /** 0-based chunk index from indexer, if present */
  chunk_index?: number | null;
  /** Total chunks for this document at index time, if present */
  total_chunks?: number | null;
  /** Number of context blocks sent to the LLM for this answer */
  prompt_context_total?: number;
}

export interface ResponseMeta {
  confidence: Confidence;
  abstention_triggered: boolean;
  citation_count: number;
  retrieval_time_ms: number;
  generation_time_ms: number;
  total_time_ms: number;
  trace_id: string;
  error?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Source[];
  meta?: ResponseMeta;
  isStreaming?: boolean;
  timestamp: Date;
}

export interface IngestSettings {
  chunkStrategy: string;
  chunkSize: number;
  overlap: number;
  embeddingKey: string;
  dbBackend: string;
  templateId: number;
  /** Ollama model tag (e.g. gemma3:12b). Ingest always uses the Ollama backend. */
  ollamaModel: string;
  useRerank: boolean;
}

export interface IngestResponse {
  session_id: string;
  num_chunks: number;
  embedding_dim: number;
  index_type: string;
  chunk_strategy: string;
  source_filename: string;
  status: string;
}

export interface ChatSettings {
  topK: number;
  fetchK: number;
  templateId: number;
  rerank: boolean;
}

export interface ChatResponse {
  answer: string;
  abstention_triggered: boolean;
  confidence: Confidence;
  citation_count: number;
  sources: Source[];
  retrieval_time_ms: number;
  generation_time_ms: number;
  total_time_ms: number;
  trace_id: string;
}

export interface HealthResponse {
  status: string;
  ollama_reachable: boolean;
  active_sessions: number;
}

export interface SessionInfo {
  session_id: string;
  source_filename: string;
  num_chunks: number;
  embedding_dim: number;
  embedding_model: string;
  db_backend: string;
  chunk_strategy: string;
  llm_backend: string;
  ollama_model: string | null;
  hf_model_key: string | null;
}

export interface EvalResult extends Record<string, unknown> {
  question?: string;
  answer?: string;
  rouge1?: number;
  faithfulness?: number;
  retrieval_time_ms?: number;
  generation_time_ms?: number;
}

