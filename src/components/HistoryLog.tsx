import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, CornerDownRight, ScrollText, Trash2, Calendar } from "lucide-react";
import { SupportInquiry } from "../types";

interface HistoryLogProps {
  inquiries: SupportInquiry[];
  onClear: () => void;
}

export default function HistoryLog({ inquiries, onClear }: HistoryLogProps) {
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  const handleClear = async () => {
    if (confirm("Permanently wipe out support ticket audit logging history?")) {
      try {
        const res = await fetch("/api/support/inquiries/clear", { method: "POST" });
        if (res.ok) {
          onClear();
          setSelectedInquiryId(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const selectedInquiry = inquiries.find(i => i.id === selectedInquiryId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* List Panel */}
      <div className="lg:col-span-12 xl:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif italic text-slate-700 text-lg flex items-center gap-2 font-medium">
            <ScrollText className="w-5 h-5 text-natural-sage" />
            Support Ticket Logs ({inquiries.length})
          </h3>
          {inquiries.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Logs
            </button>
          )}
        </div>

        <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
          {inquiries.map((inq) => (
            <button
              key={inq.id}
              onClick={() => setSelectedInquiryId(inq.id)}
              className={`w-full text-left p-4 border rounded-xl transition-all flex justify-between gap-4 group cursor-pointer ${
                selectedInquiryId === inq.id 
                  ? "bg-natural-sage border-natural-sage text-white shadow-sm" 
                  : "bg-white border-natural-line hover:border-natural-sage text-slate-800"
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    inq.status === 'escalated' ? "bg-amber-500" : "bg-[#7B8B6F]"
                  }`} />
                  <p className={`font-semibold text-xs truncate ${
                    selectedInquiryId === inq.id ? "text-white" : "text-slate-800"
                  }`}>
                    {inq.customerName}
                  </p>
                </div>
                <p className={`text-xs line-clamp-1 italic ${
                  selectedInquiryId === inq.id ? "text-white/90" : "text-slate-500"
                }`}>
                  "{inq.query}"
                </p>
                <div className={`flex items-center gap-2 text-[10px] ${
                  selectedInquiryId === inq.id ? "text-white/70" : "text-slate-400"
                }`}>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(inq.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 self-center shrink-0 transition-transform ${
                selectedInquiryId === inq.id ? "text-white translate-x-0.5" : "text-slate-300 group-hover:text-natural-sage"
              }`} />
            </button>
          ))}

          {inquiries.length === 0 && (
            <div className="border border-dashed border-natural-line rounded-2xl p-8 text-center text-slate-400 text-xs bg-natural-surface/15">
              No historical tickets created in this session. Go to the simulator sandbox and submit inquiries to populate audit traces.
            </div>
          )}
        </div>
      </div>

      {/* Inspect Trace Panel */}
      <div className="lg:col-span-12 xl:col-span-7">
        {selectedInquiry ? (
          <div className="bg-white border border-natural-line rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-natural-line pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest bg-natural-surface text-natural-sage border border-natural-line/50 px-2.5 py-0.5 rounded font-bold font-mono">
                  {selectedInquiry.id}
                </span>
                <p className="text-xs text-slate-400 mt-1.5">Audit log inspection</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl font-medium">
                {selectedInquiry.status === 'escalated' ? (
                  <span className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Flagged: Human Escalation
                  </span>
                ) : (
                  <span className="bg-[#7B8B6F]/10 border border-[#7B8B6F]/25 text-[#7B8B6F] px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-natural-sage" />
                    Auto Resolved
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-natural-sage">Customer Payload</span>
                <div className="bg-white border border-natural-line rounded-xl p-3.5 shadow-xs">
                  <p className="text-xs text-slate-500 font-mono">From: {selectedInquiry.customerName} ({selectedInquiry.customerEmail})</p>
                  <p className="text-sm font-medium text-slate-800 mt-1 leading-relaxed font-sans">"{selectedInquiry.query}"</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-natural-sage">Agent Output Response</span>
                <div className="bg-natural-surface/30 border border-natural-line p-4 rounded-xl text-slate-700 text-sm whitespace-pre-wrap leading-relaxed shadow-xs font-sans">
                  {selectedInquiry.response}
                </div>
              </div>

              {selectedInquiry.sources.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-natural-sage">Retrieved Sources Matched (RAG)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedInquiry.sources.map((src, id) => (
                      <div key={id} className="bg-white border border-natural-line rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                        <span className="text-xs font-medium text-slate-700 truncate">{src.title}</span>
                        <div className="flex items-center gap-2 mt-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-natural-sage" />
                          <span className="text-[10px] font-mono text-[#7B8B6F] font-bold bg-natural-surface/75 border border-natural-line/40 px-1.5 py-0.5 rounded">
                            Similarity: {src.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedInquiry.retrievalExplanation && (
                <div className="space-y-1.5 bg-[#FAF9F5] border border-natural-line p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-natural-sage uppercase tracking-wide">RAG Match Logic Trace</span>
                  <p className="text-xs text-slate-600 font-mono mt-1 leading-relaxed">
                    {selectedInquiry.retrievalExplanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[350px] border border-dashed border-natural-line rounded-2xl flex flex-col items-center justify-center p-8 bg-natural-surface/10 text-center text-slate-450 text-xs">
            Select a support log card on the left to examine query vector details, similarity metrics, context compilation, and model results.
          </div>
        )}
      </div>
    </div>
  );
}
