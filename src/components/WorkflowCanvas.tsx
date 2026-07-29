import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move, Sparkles, Plus, Trash2 } from 'lucide-react';
import { WorkflowNode, Connection, CanvasState } from '../types';
import { CanvasNode } from './CanvasNode';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onRunNode: (nodeId: string) => void;
  onOpenPromptModal: (parentNodeId?: string) => void;
  onAddConnection: (connection: Omit<Connection, 'id'>) => void;
  onDeleteConnection: (connectionId: string) => void;
  activeExecutingNodeId?: string | null;
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

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  onDeleteNode,
  onRunNode,
  onOpenPromptModal,
  onAddConnection,
  onDeleteConnection,
  activeExecutingNodeId,
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Interactive connection wire drawing state
  const [connecting, setConnecting] = useState<{
    fromNodeId: string;
    fromPortId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Calculate Port Coordinates with DOM element precision
  const getPortCoordinates = (nodeId: string, portId: string, isOutput: boolean) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const matchingPort = isOutput 
      ? node.outputs.find(p => p.id === portId || p.name === portId)
      : node.inputs.find(p => p.id === portId || p.name === portId);
    
    const actualPortId = matchingPort?.id || portId;
    const elem = document.getElementById(`port-${nodeId}-${actualPortId}`);
    const canvasElem = canvasRef.current;

    if (elem && canvasElem) {
      const portRect = elem.getBoundingClientRect();
      const canvasRect = canvasElem.getBoundingClientRect();
      const x = (portRect.left + portRect.width / 2 - canvasRect.left - canvasState.pan.x) / canvasState.zoom;
      const y = (portRect.top + portRect.height / 2 - canvasRect.top - canvasState.pan.y) / canvasState.zoom;
      return { x, y };
    }

    const NODE_WIDTH = 320; // 80 * 4
    if (isOutput) {
      const portIndex = Math.max(0, node.outputs.findIndex(p => p.id === portId || p.name === portId));
      return {
        x: node.x + NODE_WIDTH,
        y: node.y + 115 + (portIndex * 24)
      };
    } else {
      const portIndex = Math.max(0, node.inputs.findIndex(p => p.id === portId || p.name === portId));
      return {
        x: node.x,
        y: node.y + 115 + (portIndex * 24)
      };
    }
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      onSelectNode(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasState(prev => ({
        ...prev,
        pan: {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        }
      }));
    } else if (draggingNodeId) {
      const newX = (e.clientX - canvasState.pan.x) / canvasState.zoom - dragOffset.x;
      const newY = (e.clientY - canvasState.pan.y) / canvasState.zoom - dragOffset.y;
      onUpdateNodePosition(draggingNodeId, Math.round(newX), Math.round(newY));
    } else if (connecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
        const mouseY = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;
        setConnecting(prev => prev ? { ...prev, currentX: mouseX, currentY: mouseY } : null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnecting(null);
  };

  // Node Drag Start
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);
    const mouseX = (e.clientX - canvasState.pan.x) / canvasState.zoom;
    const mouseY = (e.clientY - canvasState.pan.y) / canvasState.zoom;
    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y
    });
  };

  // Wire Connection Start (Output port)
  const handleStartConnection = (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => {
    if (!isOutput) return;
    const coords = getPortCoordinates(nodeId, portId, true);
    setConnecting({
      fromNodeId: nodeId,
      fromPortId: portId,
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y
    });
  };

  // Wire Connection End (Input port)
  const handleEndConnection = (toNodeId: string, toPortId: string, isOutput: boolean) => {
    if (isOutput || !connecting) return;

    if (connecting.fromNodeId !== toNodeId) {
      onAddConnection({
        fromNodeId: connecting.fromNodeId,
        fromPortId: connecting.fromPortId,
        toNodeId,
        toPortId
      });
    }
    setConnecting(null);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    const newZoom = Math.min(Math.max(0.4, canvasState.zoom * zoomFactor), 2);
    setCanvasState(prev => ({ ...prev, zoom: newZoom }));
  };

  // Reset Zoom/Pan
  const resetView = () => {
    setCanvasState({ zoom: 1, pan: { x: 40, y: 40 } });
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 bg-slate-950 overflow-hidden cursor-crosshair select-none"
      style={{
        backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px)`,
        backgroundSize: `${24 * canvasState.zoom}px ${24 * canvasState.zoom}px`,
        backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`
      }}
    >
      {/* Floating Canvas Controls & Toolbar */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-1 bg-[#161B22] border border-slate-700/80 p-1 rounded-lg shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.min(2, prev.zoom + 0.1) }))}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.max(0.4, prev.zoom - 0.1) }))}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetView}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset View (1:1)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-slate-400 px-2">
          {Math.round(canvasState.zoom * 100)}%
        </span>
      </div>

      {/* Interactive High Density Prompt Bar Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('promptInput') as HTMLInputElement;
            if (input && input.value.trim()) {
              onOpenPromptModal(selectedNodeId || undefined);
              // Store input in session storage or window state if modal reads initial prompt, or open modal directly
              input.value = '';
            }
          }}
          className="bg-[#1A1F26] border border-slate-700 rounded-xl shadow-2xl p-1 flex items-center ring-1 ring-slate-800"
        >
          <div className="px-3 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            name="promptInput"
            type="text"
            className="bg-transparent flex-1 border-none outline-none focus:outline-none focus:ring-0 text-xs py-2 text-slate-100 placeholder-slate-500 font-sans"
            placeholder="What should the next agent do? e.g. 'Scrape pricing models and email summary table'"
          />
          <div className="flex items-center px-2 gap-2">
            <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">ENTER TO ADD</span>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              title="Synthesize Agent Node"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
        <div className="flex justify-center mt-2 gap-4">
          <div className="flex items-center text-[10px] text-slate-500 font-mono">
            <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 mr-1.5 text-[9px] text-slate-400">Alt+P</kbd> Preview Step
          </div>
          <div className="flex items-center text-[10px] text-slate-500 font-mono">
            <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 mr-1.5 text-[9px] text-slate-400">Alt+R</kbd> Rollback
          </div>
        </div>
      </div>

      {/* Canvas Viewport (Transformed matrix) */}
      <div
        className="w-full h-full origin-top-left relative"
        style={{
          transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`
        }}
      >
        {/* SVG Overlay for Connections & Wires */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="wire-active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Render Connections */}
          {connections.map((conn) => {
            const start = getPortCoordinates(conn.fromNodeId, conn.fromPortId, true);
            const end = getPortCoordinates(conn.toNodeId, conn.toPortId, false);

            const dx = Math.abs(end.x - start.x) * 0.5;
            const pathData = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

            const isWireActive = activeExecutingNodeId === conn.fromNodeId || activeExecutingNodeId === conn.toNodeId;

            return (
              <g key={conn.id} className="group pointer-events-auto">
                {/* Background Click Target wire */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  className="cursor-pointer"
                  onClick={() => onDeleteConnection(conn.id)}
                />
                {/* Visible Connection Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isWireActive ? "url(#wire-active-gradient)" : "url(#wire-gradient)"}
                  strokeWidth={isWireActive ? "3" : "2"}
                  filter={isWireActive ? "url(#glow)" : undefined}
                  className="transition-all duration-300"
                />
                {/* Animated Pulse Particle for Active Wire */}
                {isWireActive && (
                  <circle r="4" fill="#38bdf8" filter="url(#glow)">
                    <animateMotion path={pathData} dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Render Active Interactive Connection Wire while dragging */}
          {connecting && (() => {
            const startX = connecting.startX;
            const startY = connecting.startY;
            const endX = connecting.currentX;
            const endY = connecting.currentY;
            const dx = Math.abs(endX - startX) * 0.5;
            const activePath = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
            return (
              <path
                d={activePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeDasharray="6,6"
                className="animate-pulse"
              />
            );
          })()}
        </svg>

        {/* Render Canvas Nodes */}
        {nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={onSelectNode}
            onDelete={onDeleteNode}
            onRunNode={onRunNode}
            onOpenPromptModal={onOpenPromptModal}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            onDragStart={handleNodeDragStart}
            onUploadDocument={onUploadDocument}
            onRemoveDocument={onRemoveDocument}
            onToggleSchedule={onToggleSchedule}
            onInlineRefineNode={onInlineRefineNode}
            onAddOutputPort={onAddOutputPort}
            onAddInputPort={onAddInputPort}
            onRemoveOutputPort={onRemoveOutputPort}
            onRemovePort={onRemovePort}
            onRenamePort={onRenamePort}
            onUpdateNodeMeta={onUpdateNodeMeta}
          />
        ))}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Canvas is Empty</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              Create your first agent node by typing a natural prompt or select a preset workflow from the top header!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
