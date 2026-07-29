export type NodeType = 'trigger' | 'agent' | 'logic' | 'transformer' | 'output';

export type NodeStatus = 'idle' | 'generating' | 'running' | 'success' | 'error';

export interface NodePort {
  id: string;
  name: string;
  type: 'string' | 'json' | 'boolean' | 'number' | 'any';
}

export interface DocumentAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // text content extracted from file
  uploadedAt: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  type: 'manual' | 'interval' | 'cron' | 'webhook';
  frequency: '1m' | '5m' | '15m' | '1h' | '24h' | 'cron';
  cronExpression?: string;
  lastRun?: string;
  nextRun?: string;
}

export interface NodeConfig {
  model: string;
  temperature: number;
  jsonOutput: boolean;
  systemInstruction?: string;
  promptTemplate?: string;
  schedule?: ScheduleConfig;
  documents?: DocumentAttachment[];
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  icon: string;
  x: number;
  y: number;
  status: NodeStatus;
  inputs: NodePort[];
  outputs: NodePort[];
  config: NodeConfig;
  userPrompt?: string; // Prompt used to create this node
  inputValues: Record<string, any>;
  outputValues: Record<string, any>;
  lastExecutionTime?: number; // ms
  error?: string;
  suggestedNextPrompts?: string[];
  systemInstruction?: string;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeTitle: string;
  status: 'started' | 'completed' | 'failed';
  inputData: any;
  outputData: any;
  durationMs: number;
  error?: string;
}

export interface PresetWorkflow {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  updatedAt?: string;
  isUserWorkflow?: boolean;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
}
