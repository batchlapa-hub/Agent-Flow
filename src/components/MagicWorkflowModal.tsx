import React, { useState } from 'react';
import { X, Wand2, Sparkles, Workflow, ArrowRight } from 'lucide-react';

interface MagicWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateWorkflow: (prompt: string) => Promise<void>;
}

export const MagicWorkflowModal: React.FC<MagicWorkflowModalProps> = ({
  isOpen,
  onClose,
  onGenerateWorkflow
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    try {
      await onGenerateWorkflow(prompt.trim());
      setPrompt('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate workflow graph');
    } finally {
      setIsGenerating(false);
    }
  };

  const sampleGoals = [
    'Automated customer support ticket categorization and response generator',
    'Tech news aggregator: fetch topic, summarize, extract key points, translate to Spanish',
    'Code audit agent: analyze typescript snippet for bugs, add JSDoc comments, format markdown',
    'Sales lead enrichment pipeline: analyze text bio, extract lead score, draft sales pitch'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161B22] border border-amber-500/40 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#1A1F26]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Wand2 className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-tight text-slate-100 font-mono">Magic Canvas Generator</h3>
              <p className="text-[10px] text-slate-400 font-mono">Generate multi-agent node graph from single objective</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 font-mono">
          {error && (
            <div className="p-2 bg-red-950/60 border border-red-800 text-red-300 text-[10px] rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Workflow Goal / Target Architecture
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder='e.g., "Build an automated market research pipeline that ingests competitor notes, evaluates SWOT risks, and drafts executive report."'
              rows={4}
              className="w-full bg-black/50 text-slate-100 text-xs rounded border border-slate-700/80 p-2.5 focus:outline-none focus:border-amber-500 placeholder-slate-600 font-mono resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
              Sample Objectives:
            </label>
            <div className="space-y-1">
              {sampleGoals.map((goal, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(goal)}
                  disabled={isGenerating}
                  className="w-full text-left text-[10px] bg-slate-800/40 hover:bg-slate-800 text-slate-300 border border-slate-700/50 rounded p-2 transition-colors cursor-pointer flex items-center justify-between group font-mono"
                >
                  <span className="line-clamp-1">{goal}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-all cursor-pointer ${
                isGenerating || !prompt.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Graph...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Full Canvas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
