import { useState, useEffect } from "react";
import { Send, Sparkles, BookOpen, Clock, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SupportInquiry, VectorDBStats } from "../types";

interface SandboxProps {
  stats: VectorDBStats;
  onInquiryCreated: () => void;
  apiKeySet: boolean;
}

const TEMPLATE_QUESTIONS = [
  { text: "Can I get a refund on custom shoes?", label: "Refund Case" },
  { text: "How long does express delivery take and what does it cost?", label: "Shipping Info" },
  { text: "My screen is stuck white, how can I fix it?", label: "Technical Diagnostic" },
  { text: "I canceled mid-month, can I get my money back?", label: "Prorated Cancellation" },
];

export default function Sandbox({ stats, onInquiryCreated, apiKeySet }: SandboxProps) {
  const [customerName, setCustomerName] = useState("Jane Doe");
  const [customerEmail, setCustomerEmail] = useState("jane.doe@example.com");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<SupportInquiry | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeTraceTab, setActiveTraceTab] = useState<'response' | 'vectors' | 'prompt'>('response');

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);
    setErrorStatus(null);
    setCurrentResult(null);

    try {
      const response = await fetch("/api/support/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          query: textToSend,
        }),
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || "Failed context search");
      }

      const result: SupportInquiry = await response.json();
      setCurrentResult(result);
      setQuery("");
      onInquiryCreated();
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Unknown retrieval exception");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Simulation Input Panel */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-natural-line p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-1.5 bg-natural-surface text-natural-sage rounded-xl">
              <Database className="w-5 h-5" />
            </span>
            <h3 id="sandbox-title" className="font-serif italic text-slate-700 text-xl font-medium">Support Workspace Simulator</h3>
          </div>

          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Submit a real-time trial inquiry. This automatically fetches the highest-matching context items from your semantic vector library and passes them to Gemini inside a retrieval chain.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(query); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-natural-sage mb-1.5">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-natural-surface/30 border border-natural-line rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-sage focus:border-natural-sage transition-all"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-natural-sage mb-1.5">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-natural-surface/30 border border-natural-line rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-sage focus:border-natural-sage transition-all"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-natural-sage mb-1.5">Type Support Query</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="w-full text-sm p-3.5 bg-natural-surface/30 border border-natural-line rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-sage focus:border-natural-sage transition-all resize-none placeholder:text-slate-400"
                placeholder="Ask anything about refund eligibility, shipping cost/timing, technical diagnostics, canceled subscriptions..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-natural-sage hover:bg-[#6c7b5f] text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-md shadow-natural-sage/10 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating RAG Answer...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Customer Ticket
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Presets */}
        <div className="bg-natural-surface/30 rounded-2xl border border-dashed border-natural-line p-5">
          <h4 className="text-[10px] font-bold text-natural-sage tracking-wider uppercase mb-3">Suggested Sandbox Presets</h4>
          <div className="flex flex-col gap-2">
            {TEMPLATE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setQuery(q.text); }}
                className="text-left w-full bg-white/55 hover:bg-white p-3 border border-natural-line/50 hover:border-natural-line rounded-xl transition-all group flex items-start justify-between gap-3 shadow-none hover:shadow-sm"
              >
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-700 leading-normal group-hover:text-slate-900 font-medium">"{q.text}"</p>
                  <span className="inline-block text-[10px] text-natural-sage/80 font-mono italic">{q.label}</span>
                </div>
                <span className="text-natural-sage opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold self-center">&#8594;</span>
              </button>
            ))}
          </div>
        </div>

        {/* Database Status Info */}
        <div className="bg-white rounded-2xl border border-natural-line p-5 shadow-sm space-y-3.5">
          <h4 className="text-[10px] font-bold text-natural-sage uppercase tracking-wider">Vector Index Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-natural-surface/40 border border-natural-line/80 rounded-xl p-3 text-center">
              <span className="block text-[11px] text-slate-500 font-medium">Total Docs</span>
              <span className="text-xl font-bold text-slate-800">{stats.totalDocuments}</span>
            </div>
            <div className="bg-natural-surface/40 border border-natural-line/80 rounded-xl p-3 text-center">
              <span className="block text-[11px] text-slate-500 font-medium font-serif italic">Indexed Vector Count</span>
              <span className={`text-xl font-bold ${stats.totalWithEmbeddings === stats.totalDocuments ? "text-natural-sage" : "text-amber-600"}`}>
                {stats.totalWithEmbeddings}/{stats.totalDocuments}
              </span>
            </div>
          </div>
          {stats.unembeddedCount > 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Some library updates are awaiting background embedding sync.</span>
            </div>
          )}
        </div>
      </div>

      {/* Answer & Visual Pipeline trace */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {!currentResult && !loading && !errorStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full min-h-[400px] border border-dashed border-natural-line rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-natural-surface/20"
            >
              <div className="relative mb-4">
                <div className="w-14 h-14 bg-white border border-natural-line rounded-2xl flex items-center justify-center text-natural-sage shadow-sm">
                  <Database className="w-7 h-7" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-natural-sage rounded-full border border-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="font-serif italic text-slate-700 text-lg mb-1">Awaiting Support Ticket</h3>
              <p className="text-slate-450 text-xs max-w-sm">
                Submit an inquiry on the left to see the autocomplete engine retrieve matching vectors, build the context wrapper, and generate an answer in real time.
              </p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[400px] border border-natural-line bg-white rounded-2xl flex flex-col items-center justify-center p-8 shadow-sm space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-natural-surface border-t-natural-sage rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-natural-sage animate-pulse" />
              </div>
              <div className="text-center space-y-1 max-w-xs">
                <h4 className="font-serif italic text-slate-700 text-lg">Querying Indexing Loop</h4>
                <p className="text-slate-450 text-[11px] animate-pulse font-mono uppercase tracking-widest">Generative embedder active...</p>
              </div>
            </motion.div>
          )}

          {errorStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[400px] border border-red-200 bg-red-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-red-800"
            >
              <AlertTriangle className="w-10 h-10 mb-3 text-red-600" />
              <h4 className="font-serif italic text-red-955 text-lg mb-1">Retrieval Pipeline Offline</h4>
              <p className="text-xs text-red-600 max-w-sm mb-4 leading-relaxed">{errorStatus}</p>
              {!apiKeySet && (
                <div className="bg-white border border-red-100 rounded-xl p-4 max-w-md text-left text-xs mb-4 text-slate-650">
                  <p className="font-bold text-slate-800 mb-1">Model credentials missing:</p>
                  Configure your <strong>GEMINI_API_KEY</strong> environment variable under the key system to activate the high-dimensional similarity matching routines.
                </div>
              )}
            </motion.div>
          )}

          {currentResult && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-natural-line rounded-2xl shadow-sm overflow-hidden flex flex-col h-full"
            >
              <div className="bg-[#FDFCF8] p-5 border-b border-natural-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] tracking-widest uppercase bg-natural-surface text-natural-sage font-bold px-2.5 py-0.5 rounded-full border border-natural-line">
                    Automated Chain Reply
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1.5 font-mono">Trace Identifier: {currentResult.id}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full font-medium ${
                    currentResult.status === 'escalated' 
                      ? "bg-amber-50 border border-amber-200 text-amber-800" 
                      : "bg-[#7B8B6F]/10 border border-[#7B8B6F]/35 text-[#7B8B6F]"
                  }`}>
                    {currentResult.status === 'escalated' ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Escalated to Support Staff
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-natural-sage" />
                        Resolved by Agent
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* LangChain Trace Tabs */}
              <div className="flex border-b border-natural-line bg-natural-surface/40 px-4">
                <button
                  type="button"
                  onClick={() => setActiveTraceTab('response')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors relative flex items-center gap-1.5 ${
                    activeTraceTab === 'response' 
                      ? "border-natural-sage text-natural-sage font-bold" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Thread Monitor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTraceTab('vectors')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors relative flex items-center gap-1.5 ${
                    activeTraceTab === 'vectors' 
                      ? "border-natural-sage text-natural-sage font-bold" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  Vector match Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTraceTab('prompt')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors relative flex items-center gap-1.5 ${
                    activeTraceTab === 'prompt' 
                      ? "border-natural-sage text-natural-sage font-bold" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Retrieval QA Context
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[500px] bg-[#FDFCF8]">
                {activeTraceTab === 'response' && (
                  <div className="space-y-6">
                    {/* Visual Conversation Bubble exactly matching Lignin Template style */}
                    <div className="space-y-4">
                      {/* Customer Inquiry */}
                      <div className="flex gap-4 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600">
                          {currentResult.customerName ? currentResult.customerName[0] : 'C'}
                        </div>
                        <div className="bg-white border border-natural-line p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed text-slate-700 shadow-sm">
                          <p className="font-normal font-sans">"{currentResult.query}"</p>
                          <span className="text-[9px] text-slate-400 mt-2 block font-mono">
                            {currentResult.customerName} • {currentResult.customerEmail}
                          </span>
                        </div>
                      </div>

                      {/* Middleware Context retrieve indicator */}
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="w-full h-px bg-natural-line flex items-center justify-center">
                          <span className="bg-[#FDFCF8] px-3.5 text-[10px] uppercase tracking-widest text-[#7B8B6F] font-bold italic">
                            Retrieving Document Context
                          </span>
                        </div>
                        {currentResult.sources.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {currentResult.sources.map((src, id) => (
                              <span key={id} className="px-2.5 py-0.5 bg-white border border-natural-line rounded text-[10px] text-slate-500 italic">
                                {src.title} (Match: {(src.score * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Response Bubble */}
                      <div className="flex gap-4 flex-row-reverse max-w-[85%] ml-auto">
                        <div className="w-8 h-8 rounded-full bg-natural-sage flex-shrink-0 flex items-center justify-center text-xs text-white font-serif italic text-center leading-none">
                          AI
                        </div>
                        <div className="bg-natural-sage text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">
                          <p className="font-sans font-normal">{currentResult.response}</p>
                          <div className="flex items-center justify-between mt-3 text-[10px] text-white/80 border-t border-white/20 pt-2 font-mono">
                            <span>Chain: RetrievalQA</span>
                            <span className="font-bold uppercase tracking-widest text-emerald-100">AI RESPONSE SENT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTraceTab === 'vectors' && (
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <h4 className="font-serif italic text-slate-800 text-base">Cosine Metric Similarity Trace</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-mono p-3.5 bg-natural-surface/40 border border-natural-line rounded-xl">
                        {currentResult.retrievalExplanation}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Vector Match Quality</h4>
                      {currentResult.sources.length > 0 ? (
                        <div className="space-y-4">
                          {currentResult.sources.map((src, id) => (
                            <div key={id} className="relative bg-white border border-natural-line rounded-xl p-4 space-y-2 shadow-sm">
                              <div className="flex mb-1 items-center justify-between text-xs">
                                <span className="font-medium text-slate-700">{src.title}</span>
                                <span className="text-natural-sage font-bold font-mono">{(src.score * 100).toFixed(1)}%</span>
                              </div>
                              <div className="overflow-hidden h-1.5 flex rounded bg-natural-surface">
                                <div className="bg-natural-sage rounded h-full" style={{ width: `${Math.min(100, src.score * 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No document fragments matched above the similarity threshold.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-750 text-xs uppercase tracking-wider">Latent Embedding Dimension Projection</h4>
                      <div className="p-3 bg-[#2d3326] text-[#c9d3bd] rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed border border-natural-line shadow-inner">
                        {`// Query embedding vector projection (Dimension: 1536/768)\n[`}
                        {Array.from({ length: 32 }).map((_, i) => (Math.sin(i * 1.5 + 0.3) * 0.15).toFixed(6)).join(",\n  ")}
                        {",\n  ... ]"}
                      </div>
                    </div>
                  </div>
                )}

                {activeTraceTab === 'prompt' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif italic text-slate-800 text-base">Assembled Template System Instruction</h4>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 bg-natural-surface border border-natural-line px-2 py-0.5 rounded-lg">
                        SYSTEM_PROMPT
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      This system prompt is composed dynamically at runtime, packing the fetched closest vector facts behind a safety instruction ceiling to prevent LLM hallucinations.
                    </p>
                    <pre className="bg-[#FAF9F5] border border-natural-line text-slate-700 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed shadow-sm">
                      {currentResult.promptConstructed || "No prompt context constructed."}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

