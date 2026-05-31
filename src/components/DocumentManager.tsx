import React, { useState } from "react";
import { Plus, Trash2, Edit2, RotateCcw, HelpCircle, HardDrive, Cpu, Check, AlertCircle } from "lucide-react";
import { KBDocument } from "../types";

interface DocumentManagerProps {
  documents: KBDocument[];
  onRefresh: () => void;
  onResetToDefaults: () => Promise<void>;
  apiKeySet: boolean;
  totalUnindexed: number;
}

export default function DocumentManager({ documents, onRefresh, onResetToDefaults, apiKeySet, totalUnindexed }: DocumentManagerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Billing & Sales");
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Add or Update document handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);

    try {
      const url = editingDocId ? `/api/kb/documents/${editingDocId}` : "/api/kb/documents";
      const method = editingDocId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });

      if (res.ok) {
        setTitle("");
        setContent("");
        setCategory("Billing & Sales");
        setEditingDocId(null);
        setShowForm(false);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to commit document");
      }
    } catch (err) {
      console.error(err);
      alert("Network or host connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // Edit document selection
  const handleEdit = (doc: KBDocument) => {
    setEditingDocId(doc.id);
    setTitle(doc.title);
    setContent(doc.content);
    setCategory(doc.category);
    setShowForm(true);
  };

  // Delete document
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document reference from the customer library?")) return;
    try {
      const res = await fetch(`/api/kb/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ingest/re-index embeddings trigger
  const handleIndexAll = async () => {
    setIndexing(true);
    try {
      const res = await fetch("/api/kb/index-all", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIndexing(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Restore library to original customer policies? This will override your manual additions and wipe inquiries trace log.")) {
      await onResetToDefaults();
    }
  };

  return (
    <div className="space-y-6">
      {/* Indexing actions banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-natural-surface/40 border border-natural-line rounded-2xl p-5 shadow-sm">
        <div>
          <h3 className="font-serif italic text-slate-700 text-lg flex items-center gap-2 font-medium">
            <HardDrive className="w-5 h-5 text-natural-sage" />
            Knowledge Base Catalog
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate guidelines. All items can be embedded into numeric vector dimensions for high-dimensional semantic search lookup inside the support loops.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          {totalUnindexed > 0 && (
            <button
              onClick={handleIndexAll}
              disabled={indexing}
              className="bg-natural-sage hover:bg-[#6c7b5f] disabled:bg-[#7b8b6f]/50 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-natural-sage/10 flex items-center gap-1.5"
            >
              <Cpu className={`w-3.5 h-3.5 ${indexing ? "animate-spin" : ""}`} />
              {indexing ? "Re-indexing..." : `Index ${totalUnindexed} Missing Vectors`}
            </button>
          )}

          <button
            onClick={handleReset}
            className="bg-white hover:bg-natural-surface border border-natural-line text-slate-650 font-medium text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-natural-sage" />
            Restore Templates
          </button>

          <button
            onClick={() => {
              if (showForm) {
                setEditingDocId(null);
                setTitle("");
                setContent("");
              }
              setShowForm(!showForm);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {showForm ? "Close Editor" : "Create Article"}
          </button>
        </div>
      </div>

      {/* Editor Form */}
      {showForm && (
        <div className="bg-white border border-natural-line rounded-2xl p-5 shadow-sm">
          <h4 className="font-serif italic text-slate-700 text-base mb-4 font-medium">
            {editingDocId ? "Modify Knowledge Base Article" : "Write Customer Source Article"}
          </h4>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-natural-sage mb-1.5">Article Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-natural-surface/20 border border-natural-line rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-sage focus:border-natural-sage transition-all"
                  placeholder="e.g. Acme Subscription Discount Rules"
                  required
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-natural-sage mb-1.5">Department Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-white border border-natural-line rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-sage focus:border-natural-sage transition-all text-slate-700"
                >
                  <option value="Billing & Sales">Billing & Sales</option>
                  <option value="Support & Logistics">Support & Logistics</option>
                  <option value="Security & Tech">Security & Tech</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-natural-sage mb-1.5">Article Content / Fact Body</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full text-sm p-3.5 bg-natural-surface/20 border border-natural-line rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-sage focus:border-natural-sage transition-all resize-none placeholder:text-slate-400"
                placeholder="Write specific customer instructions. Detail conditions, rules, instructions for troubleshooting. RAG queries extract sentence context from here."
                required
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingDocId(null);
                  setTitle("");
                  setContent("");
                }}
                className="bg-white hover:bg-natural-surface border border-natural-line text-slate-605 font-semibold text-xs py-2 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-natural-sage hover:bg-[#6c7b5f] text-white font-medium text-xs py-2 px-4 rounded-xl shadow-md shadow-natural-sage/10 disabled:opacity-50 transition-all"
              >
                {loading ? "Saving guidelines..." : editingDocId ? "Update Article" : "Create & Auto-Embed"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doc Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-natural-line p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2.5 mb-3.5">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#7B8B6F] font-bold bg-natural-surface px-2 py-0.5 border border-natural-line/40 rounded">
                  {doc.category}
                </span>

                <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  doc.hasEmbedding 
                    ? "bg-[#7B8B6F]/10 text-natural-sage border border-[#7B8B6F]/25" 
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {doc.hasEmbedding ? (
                    <>
                      <Check className="w-3 h-3 text-natural-sage" />
                      Vector Active
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      Unindexed
                    </>
                  )}
                </div>
              </div>

              <h4 className="font-serif italic text-slate-800 text-base mb-2 group-hover:text-natural-sage transition-colors leading-snug">
                {doc.title}
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-4">
                {doc.content}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-natural-line/45 mt-4.5 pt-3.5">
              <span className="text-[9px] text-slate-400 font-mono select-none">NODE: {doc.id}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(doc)}
                  className="p-1.5 text-slate-500 hover:text-natural-sage hover:bg-natural-surface rounded-lg transition-colors"
                  title="Edit document guidelines"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove document template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="col-span-full border border-dashed border-natural-line rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-natural-surface/10">
            <HelpCircle className="w-8 h-8 text-natural-sage mb-2" />
            <p className="text-sm font-medium text-slate-655 font-serif italic">No guidelines cataloged</p>
            <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed">Create custom support articles, or click "Restore Templates" to instantly preload helpful examples.</p>
          </div>
        )}
      </div>
    </div>
  );
}
