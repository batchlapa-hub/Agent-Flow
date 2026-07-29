import React, { useState } from 'react';
import { Terminal, X, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Clock, Trash2, Code2 } from 'lucide-react';
import { ExecutionLog } from '../types';

interface ExecutionLogPanelProps {
  logs: ExecutionLog[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ExecutionLogPanel: React.FC<ExecutionLogPanelProps> = ({
  logs,
  onClearLogs,
  isOpen,
  onToggle
}) => {
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);

  if (!isOpen) return null;

  return (
    <div className="h-48 bg-[#0B0E14] border-t border-slate-800 flex flex-col z-20 shrink-0 shadow-2xl select-none text-xs">
      {/* Panel Header */}
      <div className="px-3 py-1.5 bg-[#0F1219] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Execution Logs & Trace</span>
          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
            {logs.length} events
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="text-slate-400 hover:text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
          <button
            onClick={onToggle}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Logs Table / Details split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Logs List */}
        <div className="flex-1 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 font-mono text-[10px] italic">
              No runtime trace records. Click "Deploy Workflow" or "+ Node" to run steps.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0F1219] text-[9px] text-slate-500 font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-1 px-3">Timestamp</th>
                  <th className="py-1 px-3">Node Title</th>
                  <th className="py-1 px-3">Status</th>
                  <th className="py-1 px-3">Latency</th>
                  <th className="py-1 px-3">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[10px]">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`hover:bg-slate-900/80 cursor-pointer transition-colors ${
                      selectedLog?.id === log.id ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-300'
                    }`}
                  >
                    <td className="py-1 px-3 text-slate-500 font-mono text-[10px]">{log.timestamp}</td>
                    <td className="py-1 px-3 font-semibold text-slate-200">{log.nodeTitle}</td>
                    <td className="py-1 px-3">
                      {log.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3 h-3" /> OK
                        </span>
                      )}
                      {log.status === 'started' && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 font-mono">
                          <Clock className="w-3 h-3 animate-spin" /> RUNNING
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-red-400 font-mono">
                          <AlertCircle className="w-3 h-3" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-3 text-slate-400 font-mono text-[10px]">{log.durationMs}ms</td>
                    <td className="py-1 px-3">
                      <button className="text-[9px] font-mono text-indigo-400 hover:underline flex items-center gap-1">
                        <Code2 className="w-3 h-3" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Log Inspector Sidepanel */}
        {selectedLog && (
          <div className="w-72 border-l border-slate-800 bg-[#0F1219] p-2.5 overflow-y-auto text-[10px] font-mono space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-slate-200 uppercase">{selectedLog.nodeTitle}</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div>
              <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Input Parameters:</span>
              <pre className="bg-black/40 p-1.5 rounded text-[9px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                {JSON.stringify(selectedLog.inputData, null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Output Data:</span>
              <pre className="bg-black/40 p-1.5 rounded text-[9px] font-mono text-indigo-300 overflow-x-auto border border-slate-800">
                {JSON.stringify(selectedLog.outputData, null, 2)}
              </pre>
            </div>

            {selectedLog.error && (
              <div>
                <span className="text-[9px] text-red-400 uppercase block mb-0.5">Error Log:</span>
                <p className="bg-red-950/40 border border-red-900/60 p-1.5 rounded text-[9px] font-mono text-red-300">
                  {selectedLog.error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
