import { useState, useEffect } from "react";
import { Sparkles, Database, ScrollText, Library, HelpCircle, AlertOctagon, Terminal } from "lucide-react";
import Sandbox from "./components/Sandbox";
import DocumentManager from "./components/DocumentManager";
import HistoryLog from "./components/HistoryLog";
import { KBDocument, SupportInquiry, VectorDBStats } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'kb' | 'history'>('sandbox');
  const [dbStats, setDbStats] = useState<VectorDBStats>({
    totalDocuments: 0,
    totalWithEmbeddings: 0,
    unembeddedCount: 0,
    embeddingModel: "gemini-embedding-2-preview"
  });
  const [apiKeySet, setApiKeySet] = useState<boolean>(true);
  const [kbDocs, setKbDocs] = useState<KBDocument[]>([]);
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatsAndDocs = async () => {
    try {
      // Fetch DB stats
      const statsRes = await fetch("/api/db/stats");
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setDbStats({
          totalDocuments: stats.totalDocuments,
          totalWithEmbeddings: stats.totalWithEmbeddings,
          unembeddedCount: stats.unembeddedCount,
          embeddingModel: stats.embeddingModel
        });
        setApiKeySet(stats.apiKeySet);
      }

      // Fetch documents
      const docsRes = await fetch("/api/kb/documents");
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setKbDocs(docs);
      }

      // Fetch inquiries
      const inqRes = await fetch("/api/support/inquiries");
      if (inqRes.ok) {
        const logs = await inqRes.json();
        setInquiries(logs);
      }
    } catch (err) {
      console.error("Failed to connect with server endpoints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndDocs();
  }, []);

  const handleResetToDefaults = async () => {
    try {
      const res = await fetch("/api/kb/reset", { method: "POST" });
      if (res.ok) {
        await fetchStatsAndDocs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const coveragePct = dbStats.totalDocuments > 0 
    ? Math.round((dbStats.totalWithEmbeddings / dbStats.totalDocuments) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-natural-bg text-slate-800 flex flex-col font-sans selection:bg-natural-sage selection:text-white">
      {/* Alert if API Key is not set */}
      {!apiKeySet && (
        <div className="bg-amber-600 text-white text-xs py-2 px-4 flex items-center justify-between text-center font-medium shadow-sm leading-normal z-50">
          <div className="flex items-center gap-2 mx-auto">
            <AlertOctagon className="w-4 h-4 text-white shrink-0" />
            <span>
              <strong>Attention Required:</strong> GEMINI_API_KEY is not defined in your environment secrets. RAG simulation is running on keyword-matching fallbacks. Go to <strong>Settings &gt; Secrets</strong> to add it.
            </span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <header className="border-b border-natural-line bg-natural-surface">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-natural-sage flex items-center justify-center text-white font-serif text-xl italic shadow-sm">
                L
              </div>
              <div>
                <span className="font-semibold text-base tracking-tight text-slate-900">Lignin Support Channel</span>
                <span className="ml-2 text-[9px] uppercase tracking-widest text-natural-sage font-bold px-2 py-0.5 border border-natural-sage/30 rounded-full bg-white/70">
                  RAG Chain Active
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl font-serif italic text-slate-700 leading-tight">
              Vector DB & Customer Support Agent
            </h1>
            <p className="text-xs text-slate-500 max-w-xl font-sans">
              An automated corporate assistant powered by LangChain-style retrieval-augmented generation (RAG) and high-dimensional semantic clustering.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap gap-4 items-center bg-white/80 border border-natural-line rounded-2xl p-3.5 shadow-sm">
            <div className="text-left px-2 sm:border-r border-natural-line">
              <span className="block text-[9px] text-natural-sage font-bold uppercase tracking-wider">Vector Coverage</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-850">{coveragePct}%</span>
                <span className="text-slate-400 font-mono text-[9px]">({dbStats.totalWithEmbeddings}/{dbStats.totalDocuments})</span>
              </div>
            </div>
            <div className="text-left px-2 sm:border-r border-natural-line">
              <span className="block text-[9px] text-natural-sage font-bold uppercase tracking-wider">Automations Run</span>
              <span className="text-sm font-bold text-slate-850">{inquiries.length} threads</span>
            </div>
            <div className="text-left px-2">
              <span className="block text-[9px] text-natural-sage font-bold uppercase tracking-wider">Vector Embedding Model</span>
              <span className="inline-block text-[10px] font-mono text-natural-sage bg-natural-surface/50 border border-natural-line/60 px-2 py-0.5 rounded font-semibold mt-0.5">
                {dbStats.unembeddedCount === 0 ? "active: 2-preview" : "awaiting index sync"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-natural-line">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-3 px-5 font-medium text-xs tracking-wider uppercase transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'sandbox' 
                ? "border-natural-sage text-natural-sage font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Support Sandbox
          </button>
          <button
            onClick={() => setActiveTab('kb')}
            className={`py-3 px-5 font-medium text-xs tracking-wider uppercase transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'kb' 
                ? "border-natural-sage text-natural-sage font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-5 font-medium text-xs tracking-wider uppercase transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'history' 
                ? "border-natural-sage text-natural-sage font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            Audit Traces ({inquiries.length})
          </button>
        </div>

        {/* Workspace Panels */}
        <div className="flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-natural-line border-t-natural-sage rounded-full animate-spin" />
              <p className="text-natural-sage text-xs font-mono tracking-widest uppercase animate-pulse">Syncing Vector Database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'sandbox' && (
                <Sandbox 
                  stats={dbStats} 
                  onInquiryCreated={fetchStatsAndDocs}
                  apiKeySet={apiKeySet}
                />
              )}

              {activeTab === 'kb' && (
                <DocumentManager 
                  documents={kbDocs} 
                  onRefresh={fetchStatsAndDocs}
                  onResetToDefaults={handleResetToDefaults}
                  apiKeySet={apiKeySet}
                  totalUnindexed={dbStats.unembeddedCount}
                />
              )}

              {activeTab === 'history' && (
                <HistoryLog 
                  inquiries={inquiries} 
                  onClear={fetchStatsAndDocs}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Design Footer */}
      <footer className="border-t border-natural-line bg-natural-surface py-5 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Lignin Customer Intelligence Agent Online</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[10px]">
            <span>Encoder: gemini-embedding-2-preview</span>
            <span>&bull;</span>
            <span>Generator: gemini-3.5-flash @ low-temp (0.3)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
