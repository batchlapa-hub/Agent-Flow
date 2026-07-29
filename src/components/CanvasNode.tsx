import React, { useState } from 'react';
import { Play, Trash2, Plus, CheckCircle2, AlertTriangle, RefreshCw, Eye, Clock, FileText, UploadCloud, Calendar, Paperclip, X, Sparkles, Send, Edit2, Check } from 'lucide-react';
import { WorkflowNode, NodePort } from '../types';
import { IconMapper } from './IconMapper';

interface CanvasNodeProps {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onRunNode: (nodeId: string) => void;
  onOpenPromptModal: (parentNodeId: string) => void;
  onStartConnection: (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
  onEndConnection: (nodeId: string, portId: string, isOutput: boolean) => void;
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUploadDocument?: (nodeId: string, file: File) => void;
  onRemoveDocument?: (nodeId: string, docId: string) => void;
  onToggleSchedule?: (nodeId: string) => void;
  onInlineRefineNode?: (nodeId: string, promptText: string) => Promise<void>;
  onAddOutputPort?: (nodeId: string, portName: string) => void;
  onAddInputPort?: (nodeId: string, portName: string) => void;
  onRemoveOutputPort?: (nodeId: string, portId: string) => void;
  onRemovePort?: (nodeId: string, portId: string, isOutput: boolean) => void;
  onRenamePort?: (nodeId: string, portId: string, newName: string, isOutput: boolean) => void;
  onUpdateNodeMeta?: (nodeId: string, updates: Partial<WorkflowNode>) => void;
}

export const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onRunNode,
  onOpenPromptModal,
  onStartConnection,
  onEndConnection,
  onDragStart,
  onUploadDocument,
  onRemoveDocument,
  onToggleSchedule,
  onInlineRefineNode,
  onAddOutputPort,
  onAddInputPort,
  onRemoveOutputPort,
  onRemovePort,
  onRenamePort,
  onUpdateNodeMeta
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isAddingOutput, setIsAddingOutput] = useState(false);
  const [isAddingInput, setIsAddingInput] = useState(false);
  const [newPortName, setNewPortName] = useState('');
  const [newInputPortName, setNewInputPortName] = useState('');

  // Port Inline Editing state
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [editingPortName, setEditingPortName] = useState<string>('');
  const [editingPortIsOutput, setEditingPortIsOutput] = useState<boolean>(true);

  // Editable Name & Description state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(node.title);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(node.description || '');

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== node.title && onUpdateNodeMeta) {
      onUpdateNodeMeta(node.id, { title: titleValue.trim() });
    }
  };

  const handleSaveDesc = () => {
    setIsEditingDesc(false);
    if (descValue !== node.description && onUpdateNodeMeta) {
      onUpdateNodeMeta(node.id, { description: descValue.trim() });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadDocument) {
      onUploadDocument(node.id, e.target.files[0]);
    }
  };

  const handleInlineRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePrompt.trim() || !onInlineRefineNode || isRefining) return;
    setIsRefining(true);
    try {
      await onInlineRefineNode(node.id, inlinePrompt.trim());
      setInlinePrompt('');
    } finally {
      setIsRefining(false);
    }
  };

  const handleAddPortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortName.trim() || !onAddOutputPort) return;
    onAddOutputPort(node.id, newPortName.trim().toLowerCase().replace(/\s+/g, '_'));
    setNewPortName('');
    setIsAddingOutput(false);
  };

  const handleAddInputPortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInputPortName.trim() || !onAddInputPort) return;
    onAddInputPort(node.id, newInputPortName.trim().toLowerCase().replace(/\s+/g, '_'));
    setNewInputPortName('');
    setIsAddingInput(false);
  };

  const handleStartPortRename = (portId: string, currentName: string, isOutput: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPortId(portId);
    setEditingPortName(currentName);
    setEditingPortIsOutput(isOutput);
  };

  const handleSavePortRename = () => {
    if (editingPortId && editingPortName.trim() && onRenamePort) {
      onRenamePort(node.id, editingPortId, editingPortName.trim(), editingPortIsOutput);
    }
    setEditingPortId(null);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'agent':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'transformer':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'logic':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'output':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIndicator = () => {
    switch (node.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            RUNNING
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            OK {node.lastExecutionTime ? `(${node.lastExecutionTime}ms)` : ''}
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono" title={node.error}>
            <AlertTriangle className="w-3 h-3 text-red-400" />
            FAIL
          </span>
        );
      default:
        return <span className="text-[10px] font-mono text-slate-500">IDLE</span>;
    }
  };

  const hasOutput = Object.keys(node.outputValues || {}).length > 0;

  return (
    <div
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        touchAction: 'none'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={`absolute w-80 rounded-lg bg-[#161B22] border transition-all duration-150 select-none shadow-2xl ${
        isSelected
          ? 'border-indigo-500 ring-1 ring-indigo-500/30 shadow-indigo-950/60 z-20'
          : node.status === 'running'
          ? 'border-amber-500/80 ring-1 ring-amber-500/20 z-10'
          : 'border-slate-700/80 hover:border-slate-600 z-0'
      }`}
    >
      {/* Node Header (Draggable Handle) */}
      <div
        onMouseDown={(e) => onDragStart(node.id, e)}
        className="p-2.5 bg-slate-800/40 rounded-t-lg border-b border-slate-700/80 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div className="p-1 rounded bg-slate-800/80 text-indigo-400 border border-slate-700 shrink-0">
            <IconMapper name={node.icon} className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="truncate flex-1">
            {isEditingTitle ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSaveTitle(); }}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleSaveTitle}
                  className="bg-black/90 text-white font-bold text-[10px] uppercase px-1.5 py-0.5 rounded border border-indigo-500 focus:outline-none w-full font-mono"
                  autoFocus
                />
              </form>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <span
                  onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                  className="text-[10px] font-bold uppercase tracking-tight text-slate-300 truncate cursor-text hover:text-white"
                  title="Double-click to rename node"
                >
                  {node.title}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                  className="opacity-0 group-hover/title:opacity-100 p-0.5 text-slate-500 hover:text-indigo-300 transition-opacity cursor-pointer shrink-0"
                  title="Rename Node"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
                <span className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded border shrink-0 ${getTypeBadgeColor(node.type)}`}>
                  {node.type}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action & Status Controls */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {getStatusIndicator()}
          <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunNode(node.id);
              }}
              disabled={node.status === 'running'}
              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Execute node"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Delete node"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-3 space-y-2.5 text-xs">
        {/* Node Description (Editable Inline) */}
        <div className="group/desc">
          {isEditingDesc ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSaveDesc(); }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={handleSaveDesc}
                placeholder="Click to add description..."
                className="bg-black/90 text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-indigo-500 focus:outline-none w-full font-sans"
                autoFocus
              />
            </form>
          ) : (
            <div
              onClick={(e) => { e.stopPropagation(); setIsEditingDesc(true); }}
              className="flex items-start justify-between gap-1 hover:bg-slate-800/40 p-1 rounded cursor-pointer transition-colors"
              title="Click to edit node description"
            >
              <p className="text-slate-400 text-[11px] leading-relaxed font-sans line-clamp-2 italic">
                {node.description || "Click to add description..."}
              </p>
              <Edit2 className="w-2.5 h-2.5 text-slate-600 group-hover/desc:text-indigo-400 shrink-0 mt-0.5 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Scheduler Banner (Trigger Nodes) */}
        {node.type === 'trigger' && (
          <div className="pt-1 border-t border-slate-800/80 font-mono">
            <div className="p-2 rounded bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Clock className={`w-3.5 h-3.5 shrink-0 ${node.config.schedule?.enabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                <div className="truncate">
                  <span className="font-bold text-slate-200 block truncate">
                    {node.config.schedule?.enabled
                      ? `SCHEDULE: ${node.config.schedule.type === 'cron' ? (node.config.schedule.cronExpression || 'CRON') : (node.config.schedule.frequency || '15m')}`
                      : 'SCHEDULE: MANUAL ONLY'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {node.config.schedule?.enabled ? `Next: ${node.config.schedule.nextRun || 'Pending'}` : 'Click to enable timer'}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSchedule) onToggleSchedule(node.id);
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer shrink-0 ${
                  node.config.schedule?.enabled
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                }`}
              >
                {node.config.schedule?.enabled ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* File / Document Attachments Section (ALL Node Types Support Files) */}
        <div className="pt-1 border-t border-slate-800/80 font-mono">
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold uppercase text-[9px] text-indigo-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-400" />
                Files & Context ({node.config.documents?.length || 0})
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1 text-[9px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              >
                <Paperclip className="w-2.5 h-2.5" />
                <span>+ Attach File</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.txt,.md,.csv,.json,.doc,.docx"
              />
            </div>

            {node.config.documents && node.config.documents.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {node.config.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-black/40 border border-slate-800 p-1 rounded text-[9px] text-slate-300 group"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden truncate">
                      <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate font-semibold text-slate-200" title={doc.name}>{doc.name}</span>
                      <span className="text-[8px] text-slate-500 shrink-0">({Math.round(doc.size / 1024)}KB)</span>
                    </div>
                    {onRemoveDocument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveDocument(node.id, doc.id);
                        }}
                        className="p-0.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove document"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-1.5 border border-dashed border-slate-800/80 hover:border-indigo-500/50 rounded text-center cursor-pointer transition-colors"
              >
                <span className="text-[9px] text-slate-500 block">Click or drop reference file (PDF, CSV, TXT)</span>
              </div>
            )}
          </div>
        </div>

        {node.userPrompt && (
          <div className="p-2 rounded bg-black/30 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="text-indigo-400 font-semibold">instruction: </span>
            <span className="italic text-slate-300">"{node.userPrompt}"</span>
          </div>
        )}

        {/* INLINE PROMPT BAR TO EDIT THIS SPECIFIC NODE */}
        <div className="pt-1 border-t border-slate-800/80">
          <form
            onSubmit={handleInlineRefineSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 p-1 bg-black/50 border border-indigo-500/30 hover:border-indigo-500/60 rounded transition-all focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30"
          >
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 ml-1" />
            <input
              type="text"
              value={inlinePrompt}
              onChange={(e) => setInlinePrompt(e.target.value)}
              placeholder="Prompt to edit node & outputs..."
              className="w-full bg-transparent text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isRefining || !inlinePrompt.trim()}
              className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
              title="Refine Node with AI"
            >
              {isRefining ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Send className="w-2.5 h-2.5" />
              )}
            </button>
          </form>
        </div>

        {/* Ports Wire Connectors & Dynamic Input/Output Controls */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
          {/* Inputs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">Inputs</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddingInput(prev => !prev);
                }}
                className="text-[9px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-700/80 px-1 rounded cursor-pointer"
                title="Add input port"
              >
                + Port
              </button>
            </div>

            {/* Quick Add Input Port Form */}
            {isAddingInput && (
              <form
                onSubmit={handleAddInputPortSubmit}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 my-1"
              >
                <input
                  type="text"
                  value={newInputPortName}
                  onChange={(e) => setNewInputPortName(e.target.value)}
                  placeholder="in_port"
                  className="w-24 bg-black/60 border border-slate-600 rounded text-[9px] font-mono px-1 py-0.5 text-slate-200 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-1 py-0.5 bg-slate-700 hover:bg-slate-600 text-[9px] text-white rounded font-mono"
                >
                  Add
                </button>
              </form>
            )}

            {node.inputs.map((port) => (
              <div
                key={port.id}
                className="relative flex items-center gap-1.5 text-[10px] text-slate-300 group"
              >
                <div
                  id={`port-${node.id}-${port.id}`}
                  onMouseUp={() => onEndConnection(node.id, port.id, false)}
                  className="w-3 h-3 rounded-full bg-slate-700 hover:bg-indigo-400 border-2 border-[#0B0E14] transition-all cursor-pointer -ml-4.5 shrink-0 hover:scale-125"
                  title={`Input: ${port.name}`}
                />

                {editingPortId === port.id ? (
                  <input
                    type="text"
                    value={editingPortName}
                    onChange={(e) => setEditingPortName(e.target.value)}
                    onBlur={handleSavePortRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePortRename();
                      if (e.key === 'Escape') setEditingPortId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 bg-black/90 text-slate-200 text-[10px] px-1 py-0.2 rounded border border-indigo-400 focus:outline-none font-mono"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={(e) => handleStartPortRename(port.id, port.name, false, e)}
                    className="truncate font-mono text-[10px] text-slate-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1 group/pname"
                    title="Click to rename input port"
                  >
                    {port.name}
                    <Edit2 className="w-2 h-2 text-slate-600 opacity-0 group-hover/pname:opacity-100 transition-opacity" />
                  </span>
                )}

                {(onRemovePort || onRemoveOutputPort) && node.inputs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemovePort) onRemovePort(node.id, port.id, false);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-opacity cursor-pointer shrink-0 ml-auto"
                    title="Delete input port (allowed up to last remaining port)"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}

            {node.inputs.length === 0 && (
              <span className="text-[9px] text-slate-600 font-mono italic block">Root Node</span>
            )}
          </div>

          {/* Dynamic Outputs */}
          <div className="space-y-1.5 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">Outputs</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddingOutput(prev => !prev);
                }}
                className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-1 rounded cursor-pointer"
                title="Add dynamic output port"
              >
                + Port
              </button>
            </div>

            {/* Quick Add Output Port Form */}
            {isAddingOutput && (
              <form
                onSubmit={handleAddPortSubmit}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 justify-end my-1"
              >
                <input
                  type="text"
                  value={newPortName}
                  onChange={(e) => setNewPortName(e.target.value)}
                  placeholder="port_name"
                  className="w-24 bg-black/60 border border-indigo-500/50 rounded text-[9px] font-mono px-1 py-0.5 text-indigo-300 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-1 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-[9px] text-white rounded font-mono"
                >
                  Add
                </button>
              </form>
            )}

            {node.outputs.map((port) => (
              <div
                key={port.id}
                className="relative flex items-center justify-end gap-1.5 text-[10px] text-slate-300 group"
              >
                {(onRemovePort || onRemoveOutputPort) && node.outputs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemovePort) {
                        onRemovePort(node.id, port.id, true);
                      } else if (onRemoveOutputPort) {
                        onRemoveOutputPort(node.id, port.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-opacity cursor-pointer shrink-0"
                    title="Delete output port (allowed up to last remaining port)"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}

                {editingPortId === port.id ? (
                  <input
                    type="text"
                    value={editingPortName}
                    onChange={(e) => setEditingPortName(e.target.value)}
                    onBlur={handleSavePortRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePortRename();
                      if (e.key === 'Escape') setEditingPortId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 bg-black/90 text-indigo-300 text-[10px] px-1 py-0.2 rounded border border-indigo-400 focus:outline-none font-mono text-right"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={(e) => handleStartPortRename(port.id, port.name, true, e)}
                    className="truncate font-mono text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1 group/pname"
                    title="Click to rename output port (AI LLM adapted)"
                  >
                    <Edit2 className="w-2 h-2 text-indigo-600 opacity-0 group-hover/pname:opacity-100 transition-opacity" />
                    {port.name}
                  </span>
                )}

                <div
                  id={`port-${node.id}-${port.id}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartConnection(node.id, port.id, true, e);
                  }}
                  className="w-3 h-3 rounded-full bg-indigo-500 hover:bg-indigo-300 border-2 border-[#0B0E14] transition-all cursor-pointer -mr-4.5 shrink-0 hover:scale-125 shadow-sm shadow-indigo-500/50"
                  title={`Output: ${port.name} (Drag wire)`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Output JSON Data Snippet */}
        {hasOutput && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-semibold text-emerald-400 font-mono flex items-center gap-1 text-[9px]">
                <Eye className="w-3 h-3" /> OUTPUT LOG:
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {Object.keys(node.outputValues).length} field(s)
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-slate-800 font-mono text-[10px] text-slate-300 max-h-24 overflow-y-auto leading-relaxed">
              {Object.entries(node.outputValues).map(([k, v]) => (
                <div key={k} className="truncate">
                  <span className="text-indigo-400">{k}:</span>{' '}
                  <span className="text-slate-300">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button: + Next Step */}
        <div className="pt-1.5 border-t border-slate-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPromptModal(node.id);
            }}
            className="w-full py-1 px-2 rounded bg-slate-800/60 hover:bg-slate-700/80 text-indigo-300 border border-slate-700/60 text-[10px] font-mono transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>+ Connect Next Step</span>
          </button>
        </div>
      </div>
    </div>
  );
};
