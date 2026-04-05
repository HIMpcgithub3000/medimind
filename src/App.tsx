import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Navigation } from "@/components/Navigation";
import { ChatPage } from "@/pages/ChatPage";
import { EvaluatePage } from "@/pages/EvaluatePage";
import { getSession } from "@/api/client";
import { useStore } from "@/store/useStore";

export default function App() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const st = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", st.darkMode);
  }, [st.darkMode]);

  useEffect(() => {
    const t = setTimeout(() => {
      const sid = useStore.getState().sessionId;
      if (!sid) return;
      getSession(sid)
        .then((s) => {
          useStore.getState().setSession(
            sid,
            { name: s.source_filename, size: 0, type: "application/pdf" },
            {
              numChunks: s.num_chunks,
              embeddingDim: s.embedding_dim,
              dbBackend: s.db_backend,
              chunkStrategy: s.chunk_strategy,
            }
          );
        })
        .catch(() => useStore.getState().clearSession());
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen bg-cream-50 text-teal-900 dark:bg-teal-950 dark:text-cream-100">
      <Sidebar mobileOpen={mobileMenu} onClose={() => setMobileMenu(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pb-0">
        <Topbar onMenu={() => setMobileMenu(true)} />
        <main className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<ChatPage onOpenSettings={() => setMobileMenu(true)} />} />
            <Route path="/evaluate" element={<EvaluatePage />} />
          </Routes>
        </main>
      </div>
      <Navigation mobile />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#0F6E56", color: "#FAFAF8" },
        }}
      />
    </div>
  );
}
