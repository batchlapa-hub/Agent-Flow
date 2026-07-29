import React, { useState, useEffect } from 'react';
import { X, Sparkles, Bot, ArrowRight, Wand2, Lightbulb, Zap } from 'lucide-react';
import { WorkflowNode } from '../types';

interface PromptNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: WorkflowNode[];
  initialParentNodeId?: string;
  onGenerateNode: (prompt: string, parentNodeId?: string) => Promise<void>;
}

export const PromptNodeModal: React.FC<PromptNodeModalProps> = ({
  isOpen,
  onClose,
  nodes,
  initialParentNodeId,
  onGenerateNode
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(initialParentNodeId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedParentId(initialParentNodeId);
  }, [initialParentNodeId, isOpen]);

  if (!isOpen) return null;

  const parentNode = nodes.find(n => n.id === selectedParentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    try {
      await onGenerateNode(prompt.trim(), selectedParentId);
      setPrompt('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate node');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSuggestion = (suggestedPrompt: string) => {
    setPrompt(suggestedPrompt);
  };

  // Default quick ideas
  const defaultIdeas = [
    'Extract key points & format into a JSON summary',
    'Evaluate risk level (Low/Med/High) with reasoning',
    'Translate previous step output into Spanish and French',
    'Generate a polite, professional client email draft',
    'Convert unstructured text into a markdown data table',
    'Check output for compliance or policy violations'
  ];

  const suggestionsToDisplay = parentNode?.suggestedNextPrompts && parentNode.suggestedNextPrompts.length > 0
    ? parentNode.suggestedNextPrompts
    : defaultIdeas;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161B22] border border-slate-700/80 rounded-lg w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#1A1F26]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold">
              AF
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-100 tracking-tight font-mono">Synthesize Node via Prompt</h3>
              <p className="text-[10px] text-slate-400 font-mono">Natural language instruction to agent node pipeline</p>
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 font-mono text-[10px] rounded flex items-center gap-2">
              <span className="font-bold">ERROR:</span> {error}
            </div>
          )}

          {/* Chain Connection Context */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Target Parent Connection
            </label>
            <select
              value={selectedParentId || ''}
              onChange={(e) => setSelectedParentId(e.target.value || undefined)}
              disabled={isGenerating}
              className="w-full bg-black/40 text-slate-200 text-xs rounded border border-slate-700/80 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="">-- Standalone (No parent connection) --</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title} ({node.type}) - Outputs: {node.outputs.map(o => o.name).join(', ')}
                </option>
              ))}
            </select>
            {parentNode && (
              <p className="text-[10px] text-indigo-400 mt-1 font-mono flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Will auto-connect outputs from <span className="font-bold">{parentNode.title}</span>.
              </p>
            )}
          </div>

          {/* Prompt Input Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Natural Language Instruction
              </label>
              <span className="text-[9px] text-slate-500 font-mono">Model: Gemini 3.6 Flash</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder='e.g., "Analyze competitor pricing structure, identify pricing tiers, and generate a markdown table output."'
              rows={4}
              className="w-full bg-black/50 text-slate-100 text-xs rounded border border-slate-700/80 p-3 focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-mono resize-none"
              required
            />
          </div>

          {/* Suggested Next Prompts */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 mb-1.5 uppercase">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>{parentNode ? `Recommended steps for "${parentNode.title}":` : 'Preset Action Prompts:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestionsToDisplay.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  disabled={isGenerating}
                  className="text-left text-[10px] bg-slate-800/60 hover:bg-slate-750 text-slate-300 border border-slate-700/60 hover:border-indigo-500/50 rounded px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 font-mono"
                >
                  <Wand2 className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="line-clamp-1">{sug}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono font-semibold text-white shadow-md transition-all cursor-pointer ${
                isGenerating || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Node</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
