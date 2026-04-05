import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MessageBubble } from "@/components/MessageBubble";
import { ThinkingGlow } from "@/components/ThinkingGlow";
import { ChatInput } from "@/components/ChatInput";
import { chatStream } from "@/api/client";
import { useStore, genId } from "@/store/useStore";
import type { Source } from "@/api/types";
import { truncate } from "@/lib/utils";

export function ChatPage({ onOpenSettings }: { onOpenSettings: () => void }) {
  const st = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [st.messages.length, st.isGenerating]);

  const handleSend = async (question: string) => {
    const sid = st.sessionId;
    if (!sid) return;
    st.addMessage({
      id: genId(),
      role: "user",
      content: question,
      timestamp: new Date(),
    });
    const aid = genId();
    st.addMessage({
      id: aid,
      role: "assistant",
      content: "",
      sources: [],
      isStreaming: true,
      timestamp: new Date(),
    });
    st.setGenerating(true);
    let buf = "";
    try {
      await chatStream(
        question,
        {
          topK: st.topK,
          fetchK: st.fetchK,
          templateId: st.templateId,
          rerank: st.rerank,
        },
        sid,
        (sources: Source[]) => {
          st.updateLastAssistantMessage({ sources });
        },
        (token: string) => {
          buf += token;
          st.updateLastAssistantMessage({ content: buf });
        },
        (meta) => {
          if (meta.error) {
            st.updateLastAssistantMessage({
              content: `Error: ${meta.error}`,
              isStreaming: false,
              meta: undefined,
            });
          } else {
            st.updateLastAssistantMessage({
              isStreaming: false,
              meta: {
                confidence: meta.confidence,
                abstention_triggered: meta.abstention_triggered,
                citation_count: meta.citation_count,
                retrieval_time_ms: meta.retrieval_time_ms,
                generation_time_ms: meta.generation_time_ms,
                total_time_ms: meta.total_time_ms,
                trace_id: meta.trace_id,
              },
            });
          }
          st.setGenerating(false);
        }
      );
    } catch {
      st.updateLastAssistantMessage({
        content: "Sorry, an error occurred. Please try again.",
        isStreaming: false,
      });
      st.setGenerating(false);
    }
  };

  const fname = st.sourceFile?.name;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-cream-50 dark:bg-teal-950 md:h-screen">
      <header className="hidden h-[60px] shrink-0 items-center justify-between border-b border-cream-100 bg-white/80 px-4 dark:border-teal-800 dark:bg-teal-950/80 md:flex">
        <Logo size="sm" showTagline={false} />
        <span className="max-w-md truncate text-sm text-teal-800 dark:text-cream-100">{fname || "No document"}</span>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-lg p-2 text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-cream-100"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4"
        onScroll={() => {
          const el = listRef.current;
          if (!el) return;
          const d = el.scrollHeight - el.scrollTop - el.clientHeight;
          setShowScrollFab(d > 200);
        }}
      >
        {st.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-xl font-semibold text-teal-800 dark:text-cream-100">MediMind</h2>
            <p className="mt-4 max-w-md text-teal-800 dark:text-cream-100">Evidence-grounded answers from your medical documents</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {!st.sessionId ? "Upload a document in the sidebar to begin." : `Ask a question about ${truncate(fname || "your file", 40)}`}
            </p>
          </div>
        )}
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {st.messages.map((m, i) => {
            if (m.role === "assistant" && m.isStreaming && !m.content.trim()) {
              return null;
            }
            const next = st.messages[i + 1];
            const showThinkingAfterUser =
              m.role === "user" &&
              next?.role === "assistant" &&
              next.isStreaming &&
              !next.content.trim();
            return (
              <div key={m.id} className="flex flex-col gap-2">
                <MessageBubble message={m} />
                {showThinkingAfterUser && <ThinkingGlow />}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollFab && (
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="fixed bottom-24 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-cream-50 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 md:bottom-8"
          aria-label="Scroll to bottom"
        >
          ↓
        </button>
      )}

      <ChatInput onSend={handleSend} disabled={!st.sessionId || st.isGenerating} />
    </div>
  );
}
