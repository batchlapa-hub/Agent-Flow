import React, { useState } from 'react';
import { X, FolderGit2, Save, Plus, Trash2, Copy, Download, Upload, Edit3, Check, Layers, Search, Sparkles, Clock, CheckCircle2, FileText } from 'lucide-react';
import { PresetWorkflow, WorkflowNode, Connection } from '../types';

interface WorkflowManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkflowId: string;
  activeWorkflowName: string;
  activeWorkflowDescription: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  workflows: PresetWorkflow[];
  isModified: boolean;
  onLoadWorkflow: (workflow: PresetWorkflow) => void;
  onSaveCurrentWorkflow: () => void;
  onSaveAsNewWorkflow: (name: string, description: string) => void;
  onRenameWorkflow: (workflowId: string, newName: string, newDescription?: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onDuplicateWorkflow: (workflowId: string) => void;
  onCreateBlankWorkflow: () => void;
  onExportWorkflowJSON: (workflow?: PresetWorkflow) => void;
  onImportWorkflowJSON: (file: File) => void;
}

export const WorkflowManagerModal: React.FC<WorkflowManagerModalProps> = ({
  isOpen,
  onClose,
  activeWorkflowId,
  activeWorkflowName,
  activeWorkflowDescription,
  nodes,
  connections,
  workflows,
  isModified,
  onLoadWorkflow,
  onSaveCurrentWorkflow,
  onSaveAsNewWorkflow,
  onRenameWorkflow,
  onDeleteWorkflow,
  onDuplicateWorkflow,
  onCreateBlankWorkflow,
  onExportWorkflowJSON,
  onImportWorkflowJSON
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'custom' | 'templates'>('all');

  // Save As New Form state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');

  // Inline Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDesc, setEditingDesc] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartSaveAs = () => {
    setNewWorkflowName(`${activeWorkflowName} (Copy)`);
    setNewWorkflowDesc(activeWorkflowDescription || 'Custom saved workflow graph');
    setIsCreatingNew(true);
  };

  const handleConfirmSaveAs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;
    onSaveAsNewWorkflow(newWorkflowName.trim(), newWorkflowDesc.trim());
    setIsCreatingNew(false);
  };

  const handleStartRename = (wf: PresetWorkflow) => {
    setEditingId(wf.id);
    setEditingName(wf.name);
    setEditingDesc(wf.description || '');
  };

  const handleConfirmRename = (id: string) => {
    if (editingName.trim()) {
      onRenameWorkflow(id, editingName.trim(), editingDesc.trim());
    }
    setEditingId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportWorkflowJSON(e.target.files[0]);
    }
  };

  const filteredWorkflows = workflows.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'custom') return wf.isUserWorkflow;
    if (filterTab === 'templates') return !wf.isUserWorkflow;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161B22] border border-slate-700/80 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#1A1F26]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-slate-100 font-mono flex items-center gap-2">
                Workflow Manager
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                  {workflows.length} Workflows
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Save current canvas, create new versions, rename, or load saved pipelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Active Workflow Banner & Quick Actions */}
        <div className="p-4 bg-[#0F1219] border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-900/40 px-1.5 py-0.5 rounded border border-indigo-700/50">
                  Active Canvas Workflow
                </span>
                {isModified && (
                  <span className="text-[9px] font-mono text-amber-400 flex items-center gap-1 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved Changes
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white font-mono">{activeWorkflowName}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-1">{activeWorkflowDescription || 'Custom canvas workflow graph'}</p>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                <span>{nodes.length} Nodes</span>
                <span>•</span>
                <span>{connections.length} Connections</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={onSaveCurrentWorkflow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm shadow-indigo-600/30 font-mono"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Workflow</span>
              </button>

              <button
                onClick={handleStartSaveAs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer font-mono"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Save As New...</span>
              </button>

              <button
                onClick={onCreateBlankWorkflow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer font-mono"
              >
                <span>+ Blank Canvas</span>
              </button>
            </div>
          </div>

          {/* Inline Form for "Save As New Workflow" */}
          {isCreatingNew && (
            <form onSubmit={handleConfirmSaveAs} className="p-3 bg-indigo-950/40 border border-indigo-500/50 rounded-lg space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-300 font-mono uppercase">Save Current Graph As New Workflow</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Workflow Title / Name</label>
                  <input
                    type="text"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    placeholder="e.g. Finance Audit Pipeline V2"
                    className="w-full bg-black/60 border border-indigo-500/60 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Short Description</label>
                  <input
                    type="text"
                    value={newWorkflowDesc}
                    onChange={(e) => setNewWorkflowDesc(e.target.value)}
                    placeholder="Brief objective of this workflow..."
                    className="w-full bg-black/60 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-2.5 py-1 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newWorkflowName.trim()}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold disabled:opacity-40"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          )}

          {/* Search & Tabs Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workflows by name..."
                className="w-full bg-[#161B22] border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#161B22] p-1 rounded-md border border-slate-800 w-full sm:w-auto justify-center">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  filterTab === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({workflows.length})
              </button>
              <button
                onClick={() => setFilterTab('custom')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  filterTab === 'custom' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Saved Workflows ({workflows.filter(w => w.isUserWorkflow).length})
              </button>
              <button
                onClick={() => setFilterTab('templates')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  filterTab === 'templates' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Presets ({workflows.filter(w => !w.isUserWorkflow).length})
              </button>
            </div>

            {/* JSON Import / Export */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer font-mono"
                title="Import JSON workflow file"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Import JSON</span>
              </button>
              <button
                onClick={() => onExportWorkflowJSON()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer font-mono"
                title="Export current canvas to JSON"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Grid / List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar min-h-[300px]">
          {filteredWorkflows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-xs font-mono">No workflows matched your search filter.</p>
            </div>
          ) : (
            filteredWorkflows.map((wf) => {
              const isActive = wf.id === activeWorkflowId;
              const isEditingThis = editingId === wf.id;

              return (
                <div
                  key={wf.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-indigo-950/20 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                      : 'bg-[#161B22] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Left details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isActive && (
                          <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Active On Canvas
                          </span>
                        )}

                        <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                          {wf.category || 'General'}
                        </span>

                        {wf.isUserWorkflow && (
                          <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                            User Saved Workflow
                          </span>
                        )}

                        {wf.updatedAt && (
                          <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Updated {wf.updatedAt}
                          </span>
                        )}
                      </div>

                      {/* Title editing */}
                      {isEditingThis ? (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full bg-black/80 border border-indigo-500 rounded p-1.5 font-mono text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editingDesc}
                            onChange={(e) => setEditingDesc(e.target.value)}
                            placeholder="Description..."
                            className="w-full bg-black/80 border border-slate-700 rounded p-1.5 text-xs text-slate-300 focus:outline-none"
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleConfirmRename(wf.id)}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px]"
                            >
                              Save Name
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 text-slate-400 hover:text-white text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 group/title">
                            <h4 className="text-sm font-bold text-slate-100 font-mono tracking-tight">{wf.name}</h4>
                            <button
                              onClick={() => handleStartRename(wf)}
                              className="opacity-0 group-hover/title:opacity-100 text-slate-500 hover:text-indigo-400 p-0.5 transition-opacity cursor-pointer"
                              title="Rename workflow"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{wf.description}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-1">
                        <span>{wf.nodes.length} Nodes</span>
                        <span>•</span>
                        <span>{wf.connections.length} Connections</span>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onLoadWorkflow(wf);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer font-mono"
                        >
                          Load Workflow
                        </button>
                      )}

                      {isActive && (
                        <button
                          onClick={onSaveCurrentWorkflow}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 transition-colors cursor-pointer font-mono flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save Canvas</span>
                        </button>
                      )}

                      <button
                        onClick={() => onDuplicateWorkflow(wf.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Duplicate workflow"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onExportWorkflowJSON(wf)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Download workflow JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {wf.isUserWorkflow && (
                        <button
                          onClick={() => onDeleteWorkflow(wf.id)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-red-400 border border-slate-800 hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Delete saved workflow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#1A1F26] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>All saved workflows are persisted locally in browser state.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
