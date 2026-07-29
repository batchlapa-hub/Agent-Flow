import React, { useState, useEffect } from 'react';
import { WorkflowNode, Connection, ExecutionLog, PresetWorkflow, DocumentAttachment } from './types';
import { INITIAL_PRESETS } from './data/presets';
import { Header } from './components/Header';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { PromptNodeModal } from './components/PromptNodeModal';
import { MagicWorkflowModal } from './components/MagicWorkflowModal';
import { NodeInspectorDrawer } from './components/NodeInspectorDrawer';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';
import { WorkflowManagerModal } from './components/WorkflowManagerModal';

const USER_WORKFLOWS_STORAGE_KEY = 'agentflow_user_workflows_v2';

export default function App() {
  // Saved Workflows State (combines presets + user saved workflows in localStorage)
  const [workflows, setWorkflows] = useState<PresetWorkflow[]>(() => {
    try {
      const saved = localStorage.getItem(USER_WORKFLOWS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved workflows from storage', e);
    }
    return INITIAL_PRESETS;
  });

  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(INITIAL_PRESETS[0].id);
  const [activeWorkflowName, setActiveWorkflowName] = useState<string>(INITIAL_PRESETS[0].name);
  const [activeWorkflowDescription, setActiveWorkflowDescription] = useState<string>(INITIAL_PRESETS[0].description);
  const [isModified, setIsModified] = useState<boolean>(false);

  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_PRESETS[0].nodes);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_PRESETS[0].connections);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeExecutingNodeId, setActiveExecutingNodeId] = useState<string | null>(null);

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptParentNodeId, setPromptParentNodeId] = useState<string | undefined>(undefined);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [isWorkflowManagerOpen, setIsWorkflowManagerOpen] = useState(false);

  // Logs & Drawer
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);

  // Helper to persist workflows array to localStorage
  const saveWorkflowsToStorage = (updatedList: PresetWorkflow[]) => {
    setWorkflows(updatedList);
    try {
      localStorage.setItem(USER_WORKFLOWS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to persist workflows to localStorage', err);
    }
  };

  // Load a Workflow onto Canvas
  const handleLoadWorkflow = (wf: PresetWorkflow) => {
    setNodes(wf.nodes);
    setConnections(wf.connections);
    setActiveWorkflowId(wf.id);
    setActiveWorkflowName(wf.name);
    setActiveWorkflowDescription(wf.description || '');
    setSelectedNodeId(null);
    setIsModified(false);
  };

  // Save Current Workflow Canvas State
  const handleSaveCurrentWorkflow = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const existingIndex = workflows.findIndex(w => w.id === activeWorkflowId);

    let updatedList: PresetWorkflow[];
    if (existingIndex >= 0) {
      updatedList = workflows.map((w, idx) => idx === existingIndex ? {
        ...w,
        name: activeWorkflowName,
        description: activeWorkflowDescription,
        nodes: [...nodes],
        connections: [...connections],
        updatedAt: nowStr
      } : w);
    } else {
      const newWf: PresetWorkflow = {
        id: activeWorkflowId || `wf-saved-${Date.now()}`,
        name: activeWorkflowName || 'Custom Saved Workflow',
        description: activeWorkflowDescription || 'Custom canvas workflow graph',
        category: 'My Saved Workflows',
        nodes: [...nodes],
        connections: [...connections],
        updatedAt: nowStr,
        isUserWorkflow: true
      };
      updatedList = [newWf, ...workflows];
    }

    saveWorkflowsToStorage(updatedList);
    setIsModified(false);
  };

  // Save As New Workflow
  const handleSaveAsNewWorkflow = (name: string, description: string) => {
    const newId = `wf-user-${Date.now()}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newWf: PresetWorkflow = {
      id: newId,
      name,
      description,
      category: 'My Saved Workflows',
      nodes: [...nodes],
      connections: [...connections],
      updatedAt: nowStr,
      isUserWorkflow: true
    };

    const updatedList = [newWf, ...workflows];
    saveWorkflowsToStorage(updatedList);

    setActiveWorkflowId(newId);
    setActiveWorkflowName(name);
    setActiveWorkflowDescription(description);
    setIsModified(false);
  };

  // Rename Workflow
  const handleRenameWorkflow = (workflowId: string, newName: string, newDescription?: string) => {
    const updatedList = workflows.map(w => w.id === workflowId ? {
      ...w,
      name: newName,
      description: newDescription !== undefined ? newDescription : w.description
    } : w);

    saveWorkflowsToStorage(updatedList);

    if (workflowId === activeWorkflowId) {
      setActiveWorkflowName(newName);
      if (newDescription !== undefined) {
        setActiveWorkflowDescription(newDescription);
      }
    }
  };

  // Rename Active Workflow Directly from Header
  const handleRenameActiveWorkflow = (newName: string) => {
    setActiveWorkflowName(newName);
    setIsModified(true);
    // If matching workflow exists in storage, update its name as well
    const existingIndex = workflows.findIndex(w => w.id === activeWorkflowId);
    if (existingIndex >= 0) {
      const updatedList = workflows.map((w, idx) => idx === existingIndex ? { ...w, name: newName } : w);
      saveWorkflowsToStorage(updatedList);
    }
  };

  // Delete User Workflow
  const handleDeleteWorkflow = (workflowId: string) => {
    const updatedList = workflows.filter(w => w.id !== workflowId);
    saveWorkflowsToStorage(updatedList);

    if (workflowId === activeWorkflowId) {
      if (updatedList.length > 0) {
        handleLoadWorkflow(updatedList[0]);
      } else {
        handleCreateBlankWorkflow();
      }
    }
  };

  // Duplicate Workflow
  const handleDuplicateWorkflow = (workflowId: string) => {
    const target = workflows.find(w => w.id === workflowId);
    if (!target) return;

    const copyId = `wf-copy-${Date.now()}`;
    const copyWf: PresetWorkflow = {
      ...target,
      id: copyId,
      name: `${target.name} (Copy)`,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUserWorkflow: true
    };

    const updatedList = [copyWf, ...workflows];
    saveWorkflowsToStorage(updatedList);
  };

  // Create Blank Canvas Workflow
  const handleCreateBlankWorkflow = () => {
    const blankId = `wf-blank-${Date.now()}`;
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setActiveWorkflowId(blankId);
    setActiveWorkflowName('Untitled Workflow');
    setActiveWorkflowDescription('Blank canvas workflow graph');
    setIsModified(false);
  };

  // Select Node
  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  // Node Position Updates
  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
  };

  // Node Deletion
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Connections
  const handleAddConnection = (conn: Omit<Connection, 'id'>) => {
    // Check if exact connection already exists
    const exists = connections.some(c =>
      c.fromNodeId === conn.fromNodeId &&
      c.fromPortId === conn.fromPortId &&
      c.toNodeId === conn.toNodeId &&
      c.toPortId === conn.toPortId
    );
    if (exists) return;

    const newConn: Connection = {
      ...conn,
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setConnections(prev => [...prev, newConn]);
  };

  const handleDeleteConnection = (connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
  };

  // Upload document file directly to trigger node
  const handleUploadDocumentToNode = (nodeId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const textContent = (event.target?.result as string) || `[File Payload: ${file.name}]`;
      const newDoc: DocumentAttachment = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: textContent,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          const existingDocs = n.config.documents || [];
          const updatedDocs = [newDoc, ...existingDocs];

          const existingPortNames = n.outputs.map(o => o.name);
          let updatedOutputs = [...n.outputs];

          if (!existingPortNames.includes('document_text')) {
            updatedOutputs.push({ id: `out-document_text-${Date.now()}`, name: 'document_text', type: 'string' });
          }
          if (!existingPortNames.includes('document_name')) {
            updatedOutputs.push({ id: `out-document_name-${Date.now()}`, name: 'document_name', type: 'string' });
          }

          return {
            ...n,
            outputs: updatedOutputs,
            config: {
              ...n.config,
              documents: updatedDocs
            },
            outputValues: {
              ...n.outputValues,
              document_text: textContent,
              document_name: file.name
            }
          };
        }
        return n;
      }));
    };
    reader.readAsText(file);
  };

  // Remove uploaded document payload from trigger node
  const handleRemoveDocumentFromNode = (nodeId: string, docId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const remainingDocs = (n.config.documents || []).filter(d => d.id !== docId);
        const firstRemaining = remainingDocs[0];
        return {
          ...n,
          config: {
            ...n.config,
            documents: remainingDocs
          },
          outputValues: {
            ...n.outputValues,
            document_text: firstRemaining ? firstRemaining.content : '',
            document_name: firstRemaining ? firstRemaining.name : ''
          }
        };
      }
      return n;
    }));
  };

  // Toggle Schedule State (Enabled / Disabled)
  const handleToggleSchedule = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const currentSched = n.config.schedule || {
          enabled: false,
          type: 'interval',
          frequency: '15m',
          lastRun: 'Never',
          nextRun: 'In 15 minutes'
        };
        return {
          ...n,
          config: {
            ...n.config,
            schedule: {
              ...currentSched,
              enabled: !currentSched.enabled
            }
          }
        };
      }
      return n;
    }));
  };

  // Change Node Title / Name and Description at any time
  const handleUpdateNodeMeta = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  // Inline AI Node Refinement (edit node prompt, instructions, and dynamic outputs)
  const handleRefineNode = async (nodeId: string, promptText: string) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    try {
      const response = await fetch('/api/refine-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: targetNode, promptText })
      });

      const resData = await response.json();
      if (resData.success && resData.refinedNode) {
        const refined = resData.refinedNode;
        setNodes(prev => prev.map(n => {
          if (n.id === nodeId) {
            const newOutputKeys: string[] = refined.outputKeys || [];
            const existingPortNames = n.outputs.map(o => o.name);
            const updatedOutputs = [...n.outputs];

            newOutputKeys.forEach(key => {
              if (!existingPortNames.includes(key)) {
                updatedOutputs.push({
                  id: `out-${key}-${Date.now()}`,
                  name: key,
                  type: 'string'
                });
              }
            });

            return {
              ...n,
              title: refined.title || n.title,
              description: refined.description || n.description,
              userPrompt: refined.userPrompt || promptText,
              systemInstruction: refined.systemInstruction || n.systemInstruction,
              outputs: updatedOutputs,
              config: {
                ...n.config,
                systemInstruction: refined.systemInstruction || n.config.systemInstruction,
                jsonOutput: refined.jsonOutput !== undefined ? refined.jsonOutput : n.config.jsonOutput
              }
            };
          }
          return n;
        }));
      }
    } catch (err) {
      console.error('Failed to refine node:', err);
    }
  };

  // AI-Assisted Port Adaptation helper
  const triggerPortAIAdaptation = async (
    targetNode: WorkflowNode,
    isOutput: boolean,
    oldPortName: string,
    newPortName: string
  ) => {
    try {
      // Collect connected neighbor types for contextual intelligence
      const neighborConns = connections.filter(c =>
        isOutput ? c.fromNodeId === targetNode.id : c.toNodeId === targetNode.id
      );
      const neighborNodeIds = neighborConns.map(c => isOutput ? c.toNodeId : c.fromNodeId);
      const connectedNodeTypes = nodes.filter(n => neighborNodeIds.includes(n.id)).map(n => n.title);

      const res = await fetch('/api/adapt-port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node: targetNode,
          isOutput,
          oldPortName,
          newPortName,
          connectedNodeTypes
        })
      });

      const data = await res.json();
      if (data.success) {
        const { adaptedPortName, updatedSystemInstruction, adviceMessage } = data;

        // Apply adapted system instructions and cleaned port name to node
        setNodes(prev => prev.map(n => {
          if (n.id === targetNode.id) {
            const portsList = isOutput ? n.outputs : n.inputs;
            const updatedPorts = portsList.map(p =>
              p.name === newPortName || p.name === oldPortName ? { ...p, name: adaptedPortName || newPortName, type: data.dataType || p.type } : p
            );

            return {
              ...n,
              systemInstruction: updatedSystemInstruction || n.systemInstruction,
              outputs: isOutput ? updatedPorts : n.outputs,
              inputs: !isOutput ? updatedPorts : n.inputs,
              config: {
                ...n.config,
                systemInstruction: updatedSystemInstruction || n.config.systemInstruction
              }
            };
          }
          return n;
        }));

        // Log AI adaptation message
        const now = new Date().toLocaleTimeString();
        setLogs(prev => [
          {
            id: `log-port-${Date.now()}`,
            timestamp: now,
            nodeId: targetNode.id,
            nodeTitle: targetNode.title,
            status: data.isValid ? 'success' : 'running',
            message: `🤖 AI Port Adaptation (${isOutput ? 'Output' : 'Input'}: "${oldPortName}" ➔ "${adaptedPortName || newPortName}"): ${adviceMessage}`
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Failed AI port adaptation:', err);
    }
  };

  // Add Dynamic Output Port Manually
  const handleAddOutputPort = (nodeId: string, portName: string) => {
    if (!portName) return;
    const cleanName = portName.toLowerCase().trim().replace(/\s+/g, '_');
    const targetNode = nodes.find(n => n.id === nodeId);

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        if (n.outputs.some(o => o.name === cleanName)) return n;
        const newPort = { id: `out-${cleanName}-${Date.now()}`, name: cleanName, type: 'string' as const };
        return {
          ...n,
          outputs: [...n.outputs, newPort]
        };
      }
      return n;
    }));

    if (targetNode) {
      triggerPortAIAdaptation(targetNode, true, 'new_port', cleanName);
    }
    setIsModified(true);
  };

  // Add Dynamic Input Port Manually
  const handleAddInputPort = (nodeId: string, portName: string) => {
    if (!portName) return;
    const cleanName = portName.toLowerCase().trim().replace(/\s+/g, '_');
    const targetNode = nodes.find(n => n.id === nodeId);

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        if (n.inputs.some(i => i.name === cleanName)) return n;
        const newPort = { id: `in-${cleanName}-${Date.now()}`, name: cleanName, type: 'string' as const };
        return {
          ...n,
          inputs: [...n.inputs, newPort]
        };
      }
      return n;
    }));

    if (targetNode) {
      triggerPortAIAdaptation(targetNode, false, 'new_port', cleanName);
    }
    setIsModified(true);
  };

  // Rename Port (Input or Output) with Instant Local UI Update + AI Adaptation
  const handleRenamePort = (nodeId: string, portId: string, newName: string, isOutput: boolean) => {
    if (!newName.trim()) return;
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    let oldPortName = '';

    // 1. Instant local state update
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const ports = isOutput ? n.outputs : n.inputs;
        const updated = ports.map(p => {
          if (p.id === portId || p.name === portId) {
            oldPortName = p.name;
            return { ...p, name: newName.trim() };
          }
          return p;
        });

        return {
          ...n,
          outputs: isOutput ? updated : n.outputs,
          inputs: !isOutput ? updated : n.inputs
        };
      }
      return n;
    }));

    // 2. Trigger background AI adaptation
    if (targetNode && oldPortName && oldPortName !== newName.trim()) {
      triggerPortAIAdaptation(targetNode, isOutput, oldPortName, newName.trim());
    }
    setIsModified(true);
  };

  // Remove Port (Input or Output) - Up to the last remaining port
  const handleRemovePort = (nodeId: string, portId: string, isOutput: boolean) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const portList = isOutput ? n.outputs : n.inputs;
        if (portList.length <= 1) return n; // Keep at least 1 port as requested

        const targetPort = portList.find(p => p.id === portId || p.name === portId);
        const filteredPorts = portList.filter(p => p.id !== portId && p.name !== portId);

        // Remove associated wire connections
        if (targetPort) {
          setConnections(cPrev => cPrev.filter(conn => {
            if (isOutput) {
              return !(conn.fromNodeId === nodeId && (conn.fromPortId === portId || conn.fromPortId === targetPort.name));
            } else {
              return !(conn.toNodeId === nodeId && (conn.toPortId === portId || conn.toPortId === targetPort.name));
            }
          }));
        }

        return {
          ...n,
          outputs: isOutput ? filteredPorts : n.outputs,
          inputs: !isOutput ? filteredPorts : n.inputs
        };
      }
      return n;
    }));
    setIsModified(true);
  };

  // Legacy helper for remove output port
  const handleRemoveOutputPort = (nodeId: string, portId: string) => {
    handleRemovePort(nodeId, portId, true);
  };

  // Periodic Scheduler Timer Simulation Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setNodes(prev => prev.map(n => {
        if (n.type === 'trigger' && n.config.schedule?.enabled) {
          const nextTimestamp = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...n,
            config: {
              ...n.config,
              schedule: {
                ...n.config.schedule,
                nextRun: nextTimestamp
              }
            }
          };
        }
        return n;
      }));
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Open Prompt Modal for dynamic node generation
  const handleOpenPromptModal = (parentNodeId?: string) => {
    setPromptParentNodeId(parentNodeId);
    setIsPromptModalOpen(true);
  };

  // Generate Single Node by Prompt (Backend Call)
  const handleGenerateNodeByPrompt = async (userPrompt: string, parentNodeId?: string) => {
    const parentNode = nodes.find(n => n.id === parentNodeId);

    const res = await fetch('/api/generate-node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, parentNode })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to synthesize node');
    }

    const genNode = data.node;
    const newNodeId = `node-${Date.now()}`;

    // Calculate position relative to parent or canvas center
    const posX = parentNode ? parentNode.x + 400 : 300 + Math.random() * 50;
    const posY = parentNode ? parentNode.y + (Math.random() * 40 - 20) : 200 + Math.random() * 50;

    const newNode: WorkflowNode = {
      id: newNodeId,
      type: (genNode.nodeType as any) || 'agent',
      title: genNode.title || 'Prompt Agent',
      description: genNode.description || userPrompt,
      icon: genNode.icon || 'bot',
      x: posX,
      y: posY,
      status: 'idle',
      userPrompt,
      systemInstruction: genNode.systemInstruction,
      inputs: (genNode.inputKeys || ['input_text']).map((k: string) => ({ id: `in-${k}`, name: k, type: 'string' })),
      outputs: (genNode.outputKeys || ['output_text']).map((k: string) => ({ id: `out-${k}`, name: k, type: 'string' })),
      config: {
        model: 'gemini-3.6-flash',
        temperature: 0.7,
        jsonOutput: genNode.jsonOutput ?? false,
        systemInstruction: genNode.systemInstruction,
        promptTemplate: genNode.promptTemplate
      },
      inputValues: {},
      outputValues: {},
      suggestedNextPrompts: genNode.suggestedNextPrompts || []
    };

    setNodes(prev => [...prev, newNode]);

    // If parentNodeId provided, auto-create connection wire!
    if (parentNode && parentNode.outputs.length > 0 && newNode.inputs.length > 0) {
      handleAddConnection({
        fromNodeId: parentNode.id,
        fromPortId: parentNode.outputs[0].name || parentNode.outputs[0].id,
        toNodeId: newNodeId,
        toPortId: newNode.inputs[0].name || newNode.inputs[0].id
      });
    }

    setSelectedNodeId(newNodeId);
    setIsModified(true);
  };

  // Generate Entire Workflow via AI
  const handleGenerateFullWorkflow = async (prompt: string) => {
    const res = await fetch('/api/generate-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate workflow');
    }

    const wf = data.workflow;
    const generatedNodes: WorkflowNode[] = [];
    const generatedConns: Connection[] = [];

    // Lay out nodes horizontally with spacing
    wf.nodes.forEach((n: any, idx: number) => {
      const nodeId = n.id || `gen-node-${idx}`;
      generatedNodes.push({
        id: nodeId,
        type: n.type || 'agent',
        title: n.title,
        description: n.description,
        icon: n.icon || 'bot',
        x: 100 + idx * 420,
        y: 200 + (idx % 2 === 0 ? 0 : 50),
        status: 'idle',
        systemInstruction: n.systemInstruction,
        inputs: (n.inputKeys || []).map((k: string) => ({ id: `in-${k}`, name: k, type: 'string' })),
        outputs: (n.outputKeys || []).map((k: string) => ({ id: `out-${k}`, name: k, type: 'string' })),
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.7,
          jsonOutput: n.jsonOutput ?? true,
          systemInstruction: n.systemInstruction
        },
        inputValues: n.sampleInput ? { [n.inputKeys?.[0] || 'input']: n.sampleInput } : {},
        outputValues: {}
      });
    });

    (wf.connections || []).forEach((c: any, idx: number) => {
      generatedConns.push({
        id: `gen-conn-${idx}`,
        fromNodeId: c.fromNodeId,
        fromPortId: c.fromOutputKey,
        toNodeId: c.toNodeId,
        toPortId: c.toInputKey
      });
    });

    setNodes(generatedNodes);
    setConnections(generatedConns);
    setActiveWorkflowName(prompt.length > 30 ? `${prompt.substring(0, 30)}...` : prompt);
    setIsModified(true);
  };

  // Run Single Node
  const handleRunSingleNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'running', error: undefined } : n));
    setActiveExecutingNodeId(nodeId);

    const logId = `log-${Date.now()}`;
    const newLog: ExecutionLog = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      nodeId: node.id,
      nodeTitle: node.title,
      status: 'started',
      inputData: node.inputValues,
      outputData: null,
      durationMs: 0
    };

    setLogs(prev => [newLog, ...prev]);

    try {
      const res = await fetch('/api/execute-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node, inputValues: node.inputValues })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Execution failed');
      }

      const outputValues = data.outputValues || {};

      setNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            status: 'success',
            outputValues,
            lastExecutionTime: data.durationMs
          };
        }
        return n;
      }));

      // Update log
      setLogs(prev => prev.map(l => l.id === logId ? {
        ...l,
        status: 'completed',
        outputData: outputValues,
        durationMs: data.durationMs
      } : l));

    } catch (err: any) {
      const errMsg = err.message || 'Node execution failed';
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'error', error: errMsg } : n));
      setLogs(prev => prev.map(l => l.id === logId ? {
        ...l,
        status: 'failed',
        error: errMsg
      } : l));
    } finally {
      setActiveExecutingNodeId(null);
    }
  };

  // Run Entire Workflow Engine (Topological Pipeline Execution)
  const handleRunWorkflow = async () => {
    if (isRunningWorkflow || nodes.length === 0) return;

    setIsRunningWorkflow(true);
    setShowLogs(true);

    // Reset status of all nodes
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle', error: undefined })));

    // Map of node outputs accumulated during runtime
    const nodeOutputsMap: Record<string, Record<string, any>> = {};

    // Initial inputs from trigger node outputs if already present
    nodes.forEach(n => {
      if (Object.keys(n.outputValues || {}).length > 0) {
        nodeOutputsMap[n.id] = n.outputValues;
      }
    });

    // Topological execution order
    const visited = new Set<string>();
    const nodeMap = new Map<string, WorkflowNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Simple queue-based traversal
    const queue: string[] = [];
    nodes.forEach(n => {
      // Find incoming connections
      const hasIncoming = connections.some(c => c.toNodeId === n.id);
      if (!hasIncoming || n.type === 'trigger') {
        queue.push(n.id);
      }
    });

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (visited.has(currentNodeId)) continue;

      const currentNode = nodeMap.get(currentNodeId);
      if (!currentNode) continue;

      // Prepare inputs for currentNode from incoming connections
      const incomingConns = connections.filter(c => c.toNodeId === currentNodeId);
      const combinedInputs: Record<string, any> = { ...(currentNode.inputValues || {}) };

      incomingConns.forEach(conn => {
        const parentOutputs = nodeOutputsMap[conn.fromNodeId];
        if (parentOutputs && parentOutputs[conn.fromPortId] !== undefined) {
          combinedInputs[conn.toPortId] = parentOutputs[conn.fromPortId];
        } else if (parentOutputs && Object.keys(parentOutputs).length > 0) {
          // Fallback to first available output value if port id matches name
          combinedInputs[conn.toPortId] = parentOutputs[Object.keys(parentOutputs)[0]];
        }
      });

      // Execute current node
      setNodes(prev => prev.map(n => n.id === currentNodeId ? { ...n, status: 'running', inputValues: combinedInputs } : n));
      setActiveExecutingNodeId(currentNodeId);

      const logId = `wf-log-${Date.now()}-${currentNodeId}`;
      setLogs(prev => [{
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        nodeId: currentNodeId,
        nodeTitle: currentNode.title,
        status: 'started',
        inputData: combinedInputs,
        outputData: null,
        durationMs: 0
      }, ...prev]);

      try {
        const res = await fetch('/api/execute-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node: currentNode, inputValues: combinedInputs })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Step failed');
        }

        const outputValues = data.outputValues || {};
        nodeOutputsMap[currentNodeId] = outputValues;

        setNodes(prev => prev.map(n => n.id === currentNodeId ? {
          ...n,
          status: 'success',
          inputValues: combinedInputs,
          outputValues,
          lastExecutionTime: data.durationMs
        } : n));

        setLogs(prev => prev.map(l => l.id === logId ? {
          ...l,
          status: 'completed',
          outputData: outputValues,
          durationMs: data.durationMs
        } : l));

        visited.add(currentNodeId);

        // Enqueue downstream children
        const outgoingConns = connections.filter(c => c.fromNodeId === currentNodeId);
        outgoingConns.forEach(c => {
          if (!visited.has(c.toNodeId)) {
            queue.push(c.toNodeId);
          }
        });

      } catch (err: any) {
        const errMsg = err.message || 'Execution failed';
        setNodes(prev => prev.map(n => n.id === currentNodeId ? { ...n, status: 'error', error: errMsg } : n));
        setLogs(prev => prev.map(l => l.id === logId ? {
          ...l,
          status: 'failed',
          error: errMsg
        } : l));
        break; // Stop workflow on error
      } finally {
        setActiveExecutingNodeId(null);
      }

      // Small delay between node steps for visual feedback
      await new Promise(r => setTimeout(r, 400));
    }

    setIsRunningWorkflow(false);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setIsModified(true);
  };

  // Export JSON (supports active canvas or specific workflow target)
  const handleExportJSON = (targetWf?: PresetWorkflow) => {
    const exportNodes = targetWf ? targetWf.nodes : nodes;
    const exportConns = targetWf ? targetWf.connections : connections;
    const exportName = targetWf ? targetWf.name : activeWorkflowName;

    const exportData = {
      name: exportName,
      description: targetWf ? targetWf.description : activeWorkflowDescription,
      nodes: exportNodes,
      connections: exportConns
    };

    const fileName = (exportName || 'workflow').toLowerCase().replace(/[^a-z0-9]/g, '-') + '.json';
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON File
  const handleImportJSONFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.nodes && parsed.connections) {
          const importedName = parsed.name || file.name.replace(/\.json$/i, '');
          const importedDesc = parsed.description || 'Imported workflow';

          handleSaveAsNewWorkflow(importedName, importedDesc);
          setNodes(parsed.nodes);
          setConnections(parsed.connections);
        }
      } catch (err) {
        alert('Invalid JSON workflow file format');
      }
    };
    reader.readAsText(file);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        handleImportJSONFile(file);
      }
    };
    input.click();
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0E14] text-slate-100 overflow-hidden font-sans">
      {/* App Header */}
      <Header
        currentWorkflowName={activeWorkflowName}
        presets={workflows}
        selectedPresetId={activeWorkflowId}
        isModified={isModified}
        onSelectPreset={(presetId) => {
          const found = workflows.find(w => w.id === presetId);
          if (found) handleLoadWorkflow(found);
        }}
        onOpenPromptModal={handleOpenPromptModal}
        onOpenMagicWorkflowModal={() => setIsMagicModalOpen(true)}
        onOpenWorkflowManager={() => setIsWorkflowManagerOpen(true)}
        onSaveWorkflow={handleSaveCurrentWorkflow}
        onRenameActiveWorkflow={handleRenameActiveWorkflow}
        onRunWorkflow={handleRunWorkflow}
        isRunning={isRunningWorkflow}
        onClearCanvas={handleClearCanvas}
        onExportJSON={() => handleExportJSON()}
        onImportJSON={handleImportJSON}
        showLogs={showLogs}
        onToggleLogs={() => setShowLogs(!showLogs)}
        nodeCount={nodes.length}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Visual Interactive Canvas */}
        <WorkflowCanvas
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onUpdateNodePosition={handleUpdateNodePosition}
          onDeleteNode={handleDeleteNode}
          onRunNode={handleRunSingleNode}
          onOpenPromptModal={handleOpenPromptModal}
          onAddConnection={handleAddConnection}
          onDeleteConnection={handleDeleteConnection}
          activeExecutingNodeId={activeExecutingNodeId}
          onUploadDocument={handleUploadDocumentToNode}
          onRemoveDocument={handleRemoveDocumentFromNode}
          onToggleSchedule={handleToggleSchedule}
          onInlineRefineNode={handleRefineNode}
          onAddOutputPort={handleAddOutputPort}
          onAddInputPort={handleAddInputPort}
          onRemoveOutputPort={handleRemoveOutputPort}
          onRemovePort={handleRemovePort}
          onRenamePort={handleRenamePort}
          onUpdateNodeMeta={handleUpdateNodeMeta}
        />

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <NodeInspectorDrawer
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onUpdateNode={(updated) => setNodes(prev => prev.map(n => n.id === updated.id ? updated : n))}
            onRunNode={handleRunSingleNode}
            isRunning={isRunningWorkflow}
            onAddOutputPort={handleAddOutputPort}
            onAddInputPort={handleAddInputPort}
            onRemoveOutputPort={handleRemoveOutputPort}
            onRemovePort={handleRemovePort}
            onRenamePort={handleRenamePort}
            onRefineNode={handleRefineNode}
          />
        )}
      </div>

      {/* Collapsible Execution Log Panel */}
      <ExecutionLogPanel
        logs={logs}
        onClearLogs={() => setLogs([])}
        isOpen={showLogs}
        onToggle={() => setShowLogs(!showLogs)}
      />

      {/* Bottom Console Status Bar */}
      <footer className="h-7 border-t border-slate-800 bg-[#0F1219] flex items-center px-4 justify-between text-[10px] font-mono text-slate-500 shrink-0 select-none">
        <div className="flex space-x-6">
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            GATEWAY: CONNECTED
          </div>
          <div className="hidden sm:block">
            SYSTEM: <span className="text-slate-400">{isRunningWorkflow ? 'Workflow pipeline executing...' : 'Scheduler & Document Intake Ready'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-amber-400 font-bold">
            SCHEDULER: {nodes.some(n => n.type === 'trigger' && n.config.schedule?.enabled) ? '15m INTERVAL ACTIVE' : 'MANUAL'}
          </span>
          <span className="text-indigo-400 font-bold">
            DOCS: {nodes.reduce((acc, n) => acc + (n.config.documents?.length || 0), 0)} INGESTED
          </span>
          <span>NODES: {nodes.length}</span>
          <span className="text-slate-400">v2.1.0-scheduler</span>
        </div>
      </footer>

      {/* Prompt Node Creation Modal */}
      <PromptNodeModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        nodes={nodes}
        initialParentNodeId={promptParentNodeId}
        onGenerateNode={handleGenerateNodeByPrompt}
      />

      {/* Magic Full Workflow Builder Modal */}
      <MagicWorkflowModal
        isOpen={isMagicModalOpen}
        onClose={() => setIsMagicModalOpen(false)}
        onGenerateWorkflow={handleGenerateFullWorkflow}
      />

      {/* Workflow Manager Modal */}
      <WorkflowManagerModal
        isOpen={isWorkflowManagerOpen}
        onClose={() => setIsWorkflowManagerOpen(false)}
        activeWorkflowId={activeWorkflowId}
        activeWorkflowName={activeWorkflowName}
        activeWorkflowDescription={activeWorkflowDescription}
        nodes={nodes}
        connections={connections}
        workflows={workflows}
        isModified={isModified}
        onLoadWorkflow={handleLoadWorkflow}
        onSaveCurrentWorkflow={handleSaveCurrentWorkflow}
        onSaveAsNewWorkflow={handleSaveAsNewWorkflow}
        onRenameWorkflow={handleRenameWorkflow}
        onDeleteWorkflow={handleDeleteWorkflow}
        onDuplicateWorkflow={handleDuplicateWorkflow}
        onCreateBlankWorkflow={handleCreateBlankWorkflow}
        onExportWorkflowJSON={handleExportJSON}
        onImportWorkflowJSON={handleImportJSONFile}
      />
    </div>
  );
}
