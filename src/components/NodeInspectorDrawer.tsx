import React, { useState } from 'react';
import { X, Play, Sliders, Brain, Code, Terminal, Save, CheckCircle2, AlertCircle, Copy, Check, Clock, FileText, UploadCloud, Trash2, Paperclip, Calendar, Zap, RefreshCw } from 'lucide-react';
import { WorkflowNode, DocumentAttachment, ScheduleConfig } from '../types';

interface NodeInspectorDrawerProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdateNode: (updatedNode: WorkflowNode) => void;
  onRunNode: (nodeId: string) => void;
  isRunning: boolean;
  onAddOutputPort?: (nodeId: string, portName: string) => void;
  onAddInputPort?: (nodeId: string, portName: string) => void;
  onRemoveOutputPort?: (nodeId: string, portId: string) => void;
  onRemovePort?: (nodeId: string, portId: string, isOutput: boolean) => void;
  onRenamePort?: (nodeId: string, portId: string, newName: string, isOutput: boolean) => void;
  onRefineNode?: (nodeId: string, promptText: string) => Promise<void>;
}

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({
  node,
  onClose,
  onUpdateNode,
  onRunNode,
  isRunning,
  onAddOutputPort,
  onAddInputPort,
  onRemoveOutputPort,
  onRemovePort,
  onRenamePort,
  onRefineNode
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'files' | 'inputs' | 'outputs' | 'trigger'>(
    node?.type === 'trigger' ? 'trigger' : 'config'
  );
  const [docPreview, setDocPreview] = useState<DocumentAttachment | null>(null);
  const [newPortInput, setNewPortInput] = useState('');
  const [newInputPortInput, setNewInputPortInput] = useState('');
  const [refinePromptInput, setRefinePromptInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Drawer Port Editing state
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [editingPortName, setEditingPortName] = useState<string>('');
  const [editingPortIsOutput, setEditingPortIsOutput] = useState<boolean>(true);

  if (!node) return null;

  const handleSavePortRenameInDrawer = () => {
    if (editingPortId && editingPortName.trim() && onRenamePort && node) {
      onRenamePort(node.id, editingPortId, editingPortName.trim(), editingPortIsOutput);
    }
    setEditingPortId(null);
  };

  const handleInputChange = (key: string, value: any) => {
    onUpdateNode({
      ...node,
      inputValues: {
        ...node.inputValues,
        [key]: value
      }
    });
  };

  const handleConfigChange = (field: string, value: any) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        [field]: value
      }
    });
  };

  const handleScheduleChange = (field: keyof ScheduleConfig, value: any) => {
    const currentSchedule: ScheduleConfig = node.config.schedule || {
      enabled: true,
      type: 'interval',
      frequency: '15m',
      lastRun: 'Never',
      nextRun: 'In 15 minutes'
    };

    const updatedSchedule: ScheduleConfig = {
      ...currentSchedule,
      [field]: value
    };

    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        schedule: updatedSchedule
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const textContent = (event.target?.result as string) || `[Binary File: ${file.name}]`;
      const newDoc: DocumentAttachment = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: textContent,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const existingDocs = node.config.documents || [];
      const updatedDocs = [newDoc, ...existingDocs];

      // Ensure output ports for document_text exist
      const existingPortNames = node.outputs.map(o => o.name);
      let updatedOutputs = [...node.outputs];

      if (!existingPortNames.includes('document_text')) {
        updatedOutputs.push({ id: `out-document_text-${Date.now()}`, name: 'document_text', type: 'string' });
      }
      if (!existingPortNames.includes('document_name')) {
        updatedOutputs.push({ id: `out-document_name-${Date.now()}`, name: 'document_name', type: 'string' });
      }

      onUpdateNode({
        ...node,
        outputs: updatedOutputs,
        config: {
          ...node.config,
          documents: updatedDocs
        },
        outputValues: {
          ...node.outputValues,
          document_text: textContent,
          document_name: file.name
        }
      });
    };

    reader.readAsText(file);
  };

  const handleRemoveDocument = (docId: string) => {
    const remaining = (node.config.documents || []).filter(d => d.id !== docId);
    const firstRemaining = remaining[0];

    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        documents: remaining
      },
      outputValues: {
        ...node.outputValues,
        document_text: firstRemaining ? firstRemaining.content : '',
        document_name: firstRemaining ? firstRemaining.name : ''
      }
    });
  };

  const handleSystemInstructionChange = (val: string) => {
    onUpdateNode({
      ...node,
      systemInstruction: val,
      config: {
        ...node.config,
        systemInstruction: val
      }
    });
  };

  const handleCopyOutputs = () => {
    navigator.clipboard.writeText(JSON.stringify(node.outputValues, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-80 bg-[#0F1219] border-l border-slate-800 h-full flex flex-col z-30 shrink-0 shadow-2xl select-none text-xs">
      {/* Drawer Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#161B22]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1 rounded bg-slate-800 text-indigo-400 border border-slate-700">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-slate-100 truncate uppercase tracking-tight">{node.title}</h3>
            <span className="text-[9px] text-slate-500 font-mono">NODE_ID: {node.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRunNode(node.id)}
            disabled={isRunning || node.status === 'running'}
            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Test</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 bg-[#0F1219] font-mono text-[10px]">
        {node.type === 'trigger' && (
          <button
            onClick={() => setActiveTab('trigger')}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'trigger'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            Scheduler
          </button>
        )}
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'config'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Config
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'files'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <FileText className="w-3 h-3 text-indigo-400" />
          Files ({node.config.documents?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('inputs')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inputs'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Inputs ({Object.keys(node.inputValues || {}).length})
        </button>
        <button
          onClick={() => setActiveTab('outputs')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'outputs'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/30'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Outputs ({Object.keys(node.outputValues || {}).length})
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'files' && (
          <div className="space-y-3 text-xs font-mono">
            {/* DOCUMENT RECEIVER CONTROLS FOR ALL NODES */}
            <div className="space-y-2.5 p-3 rounded bg-[#161B22] border border-indigo-500/30">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5 text-[11px] uppercase">
                  <FileText className="w-3.5 h-3.5" />
                  Received Documents & Context Files
                </span>
                <span className="text-[9px] text-slate-500">
                  {node.config.documents?.length || 0} File(s)
                </span>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Upload PDF, CSV, TXT, or JSON to Node</label>
                <label className="w-full p-3 border border-dashed border-slate-700 hover:border-indigo-500/80 rounded bg-black/40 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <UploadCloud className="w-4 h-4 text-indigo-400 mb-1" />
                  <span className="text-[10px] text-slate-300 font-semibold">Click to upload document to this node</span>
                  <span className="text-[9px] text-slate-500">Supports PDF, CSV, TXT, MD, JSON, DOCX</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.txt,.md,.csv,.json,.doc,.docx"
                  />
                </label>
              </div>

              {/* Attached Documents List */}
              {node.config.documents && node.config.documents.length > 0 ? (
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <label className="block text-[9px] uppercase font-bold text-slate-400">Node File Payload(s)</label>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {node.config.documents.map((doc) => (
                      <div key={doc.id} className="p-2 rounded bg-black/50 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-bold text-slate-200 text-[10px] truncate" title={doc.name}>{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setDocPreview(doc)}
                              className="text-[9px] text-indigo-400 hover:underline px-1 py-0.5"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleRemoveDocument(doc.id)}
                              className="text-slate-500 hover:text-red-400 p-0.5"
                              title="Delete document"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 flex justify-between font-mono">
                          <span>Size: {Math.round(doc.size / 1024)} KB</span>
                          <span>Time: {doc.uploadedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center border border-slate-800 rounded bg-black/20 text-[10px] text-slate-500">
                  No files attached to this node. Upload a PDF, CSV, or text file above to pass reference data to AI execution.
                </div>
              )}

              {/* Document Extracted Text Preview Drawer Modal */}
              {docPreview && (
                <div className="p-2.5 bg-black/80 border border-indigo-500/40 rounded space-y-1.5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                    <span className="text-[10px] font-bold text-indigo-300 truncate">{docPreview.name}</span>
                    <button onClick={() => setDocPreview(null)} className="text-slate-400 hover:text-slate-200">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[9px] text-slate-300 max-h-32 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed p-1.5 bg-slate-950 rounded border border-slate-800">
                    {docPreview.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trigger' && (
          <div className="space-y-4 text-xs font-mono">
            {/* SCHEDULER CONTROLS */}
            <div className="space-y-2.5 p-3 rounded bg-[#161B22] border border-amber-500/30">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  Workflow Scheduler
                </span>
                <input
                  type="checkbox"
                  checked={node.config.schedule?.enabled ?? true}
                  onChange={(e) => handleScheduleChange('enabled', e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-500 cursor-pointer rounded"
                />
              </div>

              {/* Schedule Type */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Trigger Mode</label>
                <select
                  value={node.config.schedule?.type || 'interval'}
                  onChange={(e) => handleScheduleChange('type', e.target.value)}
                  className="w-full bg-black/40 text-slate-200 border border-slate-700 rounded p-1.5 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="interval">Interval (Every X min / hours)</option>
                  <option value="cron">Cron Expression (Custom schedule)</option>
                  <option value="webhook">Webhook / API Event</option>
                  <option value="manual">Manual Execution Only</option>
                </select>
              </div>

              {/* Frequency Selection */}
              {node.config.schedule?.type === 'interval' && (
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Schedule Frequency</label>
                  <select
                    value={node.config.schedule?.frequency || '15m'}
                    onChange={(e) => handleScheduleChange('frequency', e.target.value)}
                    className="w-full bg-black/40 text-slate-200 border border-slate-700 rounded p-1.5 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="1m">Every 1 Minute (High Frequency)</option>
                    <option value="5m">Every 5 Minutes</option>
                    <option value="15m">Every 15 Minutes</option>
                    <option value="1h">Every 1 Hour</option>
                    <option value="24h">Daily (Every 24 Hours)</option>
                  </select>
                </div>
              )}

              {/* Cron Expression Input */}
              {node.config.schedule?.type === 'cron' && (
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Cron Syntax</label>
                  <input
                    type="text"
                    value={node.config.schedule?.cronExpression || '0 9 * * 1'}
                    onChange={(e) => handleScheduleChange('cronExpression', e.target.value)}
                    placeholder="e.g. 0 9 * * 1"
                    className="w-full bg-black/40 text-amber-300 border border-slate-700 rounded p-1.5 text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">5-part cron syntax (Minute Hour Day Month Weekday)</span>
                </div>
              )}

              {/* Status Readouts & Quick Trigger Test */}
              <div className="pt-2 border-t border-slate-800 space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Last Run:</span>
                  <span className="text-slate-200 font-bold">{node.config.schedule?.lastRun || 'Never'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Next Scheduled:</span>
                  <span className="text-amber-400 font-bold">{node.config.schedule?.nextRun || 'Pending tick'}</span>
                </div>
                <button
                  onClick={() => {
                    handleScheduleChange('lastRun', new Date().toLocaleTimeString());
                    onRunNode(node.id);
                  }}
                  disabled={isRunning}
                  className="w-full mt-2 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  Test Fire Schedule Now
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-3 text-xs">
            {/* Node Title & Description Editing */}
            <div className="space-y-2 p-2.5 rounded bg-[#161B22] border border-slate-800">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase font-bold mb-1">Node Name / Title</label>
                <input
                  type="text"
                  value={node.title}
                  onChange={(e) => onUpdateNode({ ...node, title: e.target.value })}
                  placeholder="Node Title..."
                  className="w-full bg-black/60 text-slate-200 border border-slate-700/80 rounded p-1.5 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase font-bold mb-1">Node Description</label>
                <textarea
                  value={node.description || ''}
                  onChange={(e) => onUpdateNode({ ...node, description: e.target.value })}
                  rows={2}
                  placeholder="Describe what this node does..."
                  className="w-full bg-black/60 text-slate-200 border border-slate-700/80 rounded p-1.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            {/* AI Prompt Node Editor / Refinement Box */}
            <div className="p-3 rounded bg-indigo-950/30 border border-indigo-500/30 space-y-2">
              <label className="block text-indigo-300 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                Refine Node with AI Prompt
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={refinePromptInput}
                  onChange={(e) => setRefinePromptInput(e.target.value)}
                  placeholder="e.g. 'Extract total amount into output port total_usd'..."
                  className="flex-1 bg-black/60 text-slate-200 border border-indigo-500/40 rounded p-1.5 font-mono text-[10px] focus:outline-none focus:border-indigo-400"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && refinePromptInput.trim() && onRefineNode && !isRefining) {
                      e.preventDefault();
                      setIsRefining(true);
                      try {
                        await onRefineNode(node.id, refinePromptInput.trim());
                        setRefinePromptInput('');
                      } finally {
                        setIsRefining(false);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={isRefining || !refinePromptInput.trim() || !onRefineNode}
                  onClick={async () => {
                    if (!refinePromptInput.trim() || !onRefineNode || isRefining) return;
                    setIsRefining(true);
                    try {
                      await onRefineNode(node.id, refinePromptInput.trim());
                      setRefinePromptInput('');
                    } finally {
                      setIsRefining(false);
                    }
                  }}
                  className="px-2 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {isRefining ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Refine'}
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase font-bold mb-1">Gemini AI Model</label>
              <select
                value={node.config.model || 'gemini-3.6-flash'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full bg-[#161B22] text-slate-200 border border-slate-700/80 rounded p-1.5 font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast & General)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Advanced Reasoning)</option>
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-slate-400 font-mono text-[10px] uppercase font-bold mb-1">
                <span>Creativity (Temp)</span>
                <span className="text-indigo-400">{node.config.temperature ?? 0.7}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={node.config.temperature ?? 0.7}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* System Instruction / Prompt Persona */}
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase font-bold mb-1">System Instruction</label>
              <textarea
                value={node.systemInstruction || node.config.systemInstruction || ''}
                onChange={(e) => handleSystemInstructionChange(e.target.value)}
                rows={5}
                placeholder="Instructions guiding how this node transforms input data into outputs..."
                className="w-full bg-black/40 text-slate-200 border border-slate-800 rounded p-2.5 font-mono text-[11px] focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* JSON Output Format toggle */}
            <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-slate-800">
              <div>
                <span className="text-slate-200 font-mono text-[11px] block font-medium">JSON Schema Output</span>
                <span className="text-[9px] text-slate-500 font-mono">Enforce key-value format</span>
              </div>
              <input
                type="checkbox"
                checked={node.config.jsonOutput ?? false}
                onChange={(e) => handleConfigChange('jsonOutput', e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer rounded"
              />
            </div>

            {/* Suggested Follow-up Prompts */}
            {node.suggestedNextPrompts && node.suggestedNextPrompts.length > 0 && (
              <div>
                <label className="block text-slate-500 text-[9px] font-mono uppercase font-bold mb-1 tracking-wider">
                  Suggested Chained Actions
                </label>
                <ul className="space-y-1">
                  {node.suggestedNextPrompts.map((sug, i) => (
                    <li key={i} className="text-[10px] text-indigo-300 bg-indigo-950/30 border border-indigo-900/40 rounded p-1.5 font-mono">
                      "{sug}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inputs' && (
          <div className="space-y-4 text-xs font-mono">
            {/* Input Ports Management Section */}
            <div className="p-3 rounded bg-[#161B22] border border-slate-700/60 space-y-2">
              <span className="font-bold text-slate-300 text-[11px] uppercase block">
                Input Ports ({node.inputs.length})
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newInputPortInput}
                  onChange={(e) => setNewInputPortInput(e.target.value)}
                  placeholder="New input port (e.g. raw_images)..."
                  className="flex-1 bg-black/60 text-slate-200 border border-slate-700/80 rounded p-1.5 font-mono text-[10px] focus:outline-none focus:border-indigo-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newInputPortInput.trim() && onAddInputPort) {
                      e.preventDefault();
                      onAddInputPort(node.id, newInputPortInput.trim().toLowerCase().replace(/\s+/g, '_'));
                      setNewInputPortInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!newInputPortInput.trim() || !onAddInputPort}
                  onClick={() => {
                    if (newInputPortInput.trim() && onAddInputPort) {
                      onAddInputPort(node.id, newInputPortInput.trim().toLowerCase().replace(/\s+/g, '_'));
                      setNewInputPortInput('');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white font-mono text-[10px] disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
                >
                  + Add Input Port
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {node.inputs.map((port) => (
                  <div key={port.id} className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-slate-800 text-[10px]">
                    {editingPortId === port.id ? (
                      <input
                        type="text"
                        value={editingPortName}
                        onChange={(e) => setEditingPortName(e.target.value)}
                        onBlur={handleSavePortRenameInDrawer}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePortRenameInDrawer();
                          if (e.key === 'Escape') setEditingPortId(null);
                        }}
                        className="bg-black text-slate-200 border border-indigo-500 rounded px-1.5 py-0.5 text-[10px] font-mono focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingPortId(port.id);
                          setEditingPortName(port.name);
                          setEditingPortIsOutput(false);
                        }}
                        className="text-slate-300 font-bold hover:text-indigo-300 cursor-pointer flex items-center gap-1"
                        title="Click to rename input port (AI adapted)"
                      >
                        {port.name} <span className="text-slate-500 font-normal">({port.type})</span>
                      </span>
                    )}

                    {(onRemovePort || onRemoveOutputPort) && node.inputs.length > 1 && (
                      <button
                        onClick={() => {
                          if (onRemovePort) onRemovePort(node.id, port.id, false);
                        }}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Delete input port (allowed up to last remaining port)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Input Payload View/Edit */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-slate-400 font-mono block">
                Incoming Payload Values:
              </span>
              {node.inputs.map((port) => (
                <div key={port.id} className="space-y-1">
                  <label className="block font-mono text-slate-300 text-[10px] font-bold">
                    {port.name} <span className="text-slate-500 font-normal">({port.type})</span>
                  </label>
                  <textarea
                    value={
                      typeof node.inputValues[port.name] === 'object'
                        ? JSON.stringify(node.inputValues[port.name], null, 2)
                        : node.inputValues[port.name] ?? ''
                    }
                    onChange={(e) => handleInputChange(port.name, e.target.value)}
                    rows={3}
                    placeholder={`Input data for ${port.name}...`}
                    className="w-full bg-black/40 text-slate-200 border border-slate-800 rounded p-2 font-mono text-[10px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'outputs' && (
          <div className="space-y-4 text-xs font-mono">
            {/* Dynamic Output Ports Configuration Section */}
            <div className="p-3 rounded bg-[#161B22] border border-indigo-500/30 space-y-2">
              <span className="font-bold text-indigo-400 text-[11px] uppercase block">
                Dynamic Output Ports ({node.outputs.length})
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newPortInput}
                  onChange={(e) => setNewPortInput(e.target.value)}
                  placeholder="New port name (e.g. extracted_csv)..."
                  className="flex-1 bg-black/60 text-slate-200 border border-slate-700/80 rounded p-1.5 font-mono text-[10px] focus:outline-none focus:border-indigo-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPortInput.trim() && onAddOutputPort) {
                      e.preventDefault();
                      onAddOutputPort(node.id, newPortInput.trim().toLowerCase().replace(/\s+/g, '_'));
                      setNewPortInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!newPortInput.trim() || !onAddOutputPort}
                  onClick={() => {
                    if (newPortInput.trim() && onAddOutputPort) {
                      onAddOutputPort(node.id, newPortInput.trim().toLowerCase().replace(/\s+/g, '_'));
                      setNewPortInput('');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
                >
                  + Add Output Port
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {node.outputs.map((port) => (
                  <div key={port.id} className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-slate-800 text-[10px]">
                    {editingPortId === port.id ? (
                      <input
                        type="text"
                        value={editingPortName}
                        onChange={(e) => setEditingPortName(e.target.value)}
                        onBlur={handleSavePortRenameInDrawer}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePortRenameInDrawer();
                          if (e.key === 'Escape') setEditingPortId(null);
                        }}
                        className="bg-black text-indigo-300 border border-indigo-500 rounded px-1.5 py-0.5 text-[10px] font-mono focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingPortId(port.id);
                          setEditingPortName(port.name);
                          setEditingPortIsOutput(true);
                        }}
                        className="text-indigo-300 font-bold hover:text-indigo-200 cursor-pointer flex items-center gap-1"
                        title="Click to rename output port (AI adapted)"
                      >
                        {port.name} <span className="text-slate-500 font-normal">({port.type})</span>
                      </span>
                    )}

                    {(onRemovePort || onRemoveOutputPort) && node.outputs.length > 1 && (
                      <button
                        onClick={() => {
                          if (onRemovePort) {
                            onRemovePort(node.id, port.id, true);
                          } else if (onRemoveOutputPort) {
                            onRemoveOutputPort(node.id, port.id);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Delete output port (allowed up to last remaining port)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-300 font-mono text-[10px] font-bold uppercase">Latest Execution Output</span>
              {Object.keys(node.outputValues || {}).length > 0 && (
                <button
                  onClick={handleCopyOutputs}
                  className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'COPIED' : 'COPY JSON'}</span>
                </button>
              )}
            </div>

            {Object.keys(node.outputValues || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(node.outputValues).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <span className="font-mono text-indigo-400 text-[10px] font-bold">{key}:</span>
                    <div className="bg-black/40 text-slate-200 border border-slate-800 rounded p-2.5 font-mono text-[10px] max-h-52 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 font-mono text-[10px] border border-dashed border-slate-800 rounded">
                No output data yet. Click "Test" to execute single node.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
