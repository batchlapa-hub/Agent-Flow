import React, { useState } from 'react';
import { Play, Plus, Wand2, Terminal, Download, Upload, Trash2, FolderGit2, Save, Edit3, Check, Sparkles } from 'lucide-react';
import { PresetWorkflow } from '../types';

interface HeaderProps {
  currentWorkflowName: string;
  presets: PresetWorkflow[];
  selectedPresetId: string;
  isModified: boolean;
  onSelectPreset: (presetId: string) => void;
  onOpenPromptModal: (parentNodeId?: string) => void;
  onOpenMagicWorkflowModal: () => void;
  onOpenWorkflowManager: () => void;
  onSaveWorkflow: () => void;
  onRenameActiveWorkflow: (newName: string) => void;
  onRunWorkflow: () => void;
  isRunning: boolean;
  onClearCanvas: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  showLogs: boolean;
  onToggleLogs: () => void;
  nodeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentWorkflowName,
  presets,
  selectedPresetId,
  isModified,
  onSelectPreset,
  onOpenPromptModal,
  onOpenMagicWorkflowModal,
  onOpenWorkflowManager,
  onSaveWorkflow,
  onRenameActiveWorkflow,
  onRunWorkflow,
  isRunning,
  onClearCanvas,
  onExportJSON,
  onImportJSON,
  showLogs,
  onToggleLogs,
  nodeCount
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentWorkflowName);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (nameInput.trim() && nameInput.trim() !== currentWorkflowName) {
      onRenameActiveWorkflow(nameInput.trim());
    }
  };

  return (
    <header className="h-12 bg-[#0B0E14] border-b border-slate-800 px-4 flex items-center justify-between select-none z-30 shrink-0 text-xs">
      {/* Left section: App Brand & Editable Workflow Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/30">
            AF
          </div>
          <span className="font-semibold text-slate-100 tracking-tight text-xs hidden sm:inline font-mono">
            AGENT_FLOW
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

        {/* Workflow Title & Inline Rename Component */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSaveName(); }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                className="bg-black/90 text-white font-bold text-xs px-2 py-0.5 rounded border border-indigo-500 focus:outline-none font-mono"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 rounded bg-indigo-600 text-white"
                title="Save title"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 group/headerTitle">
              <button
                onClick={() => {
                  setNameInput(currentWorkflowName);
                  setIsEditingName(true);
                }}
                className="flex items-center gap-1.5 text-slate-100 font-bold hover:text-indigo-300 transition-colors font-mono tracking-tight text-xs max-w-[200px] md:max-w-[320px] truncate cursor-pointer"
                title="Click to change workflow name"
              >
                <span className="truncate">{currentWorkflowName}</span>
                <Edit3 className="w-3 h-3 text-slate-500 group-hover/headerTitle:text-indigo-400 opacity-0 group-hover/headerTitle:opacity-100 transition-opacity shrink-0" />
              </button>

              {isModified ? (
                <span
                  className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"
                  title="Unsaved changes on canvas"
                />
              ) : (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500/80 shrink-0"
                  title="All changes saved"
                />
              )}
            </div>
          )}

          {/* Save Workflow Button */}
          <button
            onClick={onSaveWorkflow}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
              isModified
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
            title="Save workflow state"
          >
            <Save className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">{isModified ? 'Save' : 'Saved'}</span>
          </button>

          {/* Open Workflow Manager Drawer / Modal */}
          <button
            onClick={onOpenWorkflowManager}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 transition-colors cursor-pointer font-mono text-xs"
            title="Open Workflow Manager"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Workflows</span>
          </button>
        </div>
      </div>

      {/* Metric readouts & Primary Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Latency & Token Usage metrics */}
        <div className="hidden xl:flex items-center gap-4 text-xs">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 uppercase text-[9px] font-mono tracking-tighter">Latency</span>
            <span className="text-slate-300 font-mono text-[11px]">124ms</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 uppercase text-[9px] font-mono tracking-tighter">Token Usage</span>
            <span className="text-slate-300 font-mono text-[11px]">4.2k / 50k</span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden xl:block" />

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Magic AI Workflow Builder */}
          <button
            onClick={onOpenMagicWorkflowModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/50 transition-all cursor-pointer"
            title="Generate multi-node agent workflow from high level prompt"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden lg:inline">AI Graph</span>
          </button>

          {/* Create Node by Prompt */}
          <button
            onClick={() => onOpenPromptModal()}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Node</span>
          </button>

          {/* Run Workflow */}
          <button
            onClick={onRunWorkflow}
            disabled={isRunning || nodeCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-white transition-colors cursor-pointer ${
              isRunning
                ? 'bg-amber-600 border border-amber-500 cursor-wait'
                : nodeCount === 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Deploy Workflow</span>
              </>
            )}
          </button>

          {/* Secondary buttons */}
          <div className="hidden sm:flex items-center gap-1 ml-1">
            <button
              onClick={onToggleLogs}
              className={`p-1 rounded text-xs border transition-colors cursor-pointer ${
                showLogs
                  ? 'bg-slate-800 text-indigo-400 border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
              }`}
              title="Toggle execution logs"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onExportJSON}
              className="p-1 rounded text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onImportJSON}
              className="p-1 rounded text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Import JSON"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClearCanvas}
              className="p-1 rounded text-red-400 hover:text-red-300 border border-slate-800 hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
