import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  const PORT = 3000;

  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // 1. Endpoint to generate next workflow node from prompt
  app.post("/api/generate-node", async (req, res) => {
    try {
      const { userPrompt, parentNode } = req.body;
      if (!userPrompt || typeof userPrompt !== "string") {
        return res.status(400).json({ error: "userPrompt string is required" });
      }

      const ai = getGeminiClient();

      let promptContext = `User Request: "${userPrompt}"`;
      if (parentNode) {
        promptContext += `\nParent Node Context: Title: "${parentNode.title}", Description: "${parentNode.description}", Outputs: ${JSON.stringify(parentNode.outputKeys || parentNode.outputs || [])}`;
      }

      const systemInstruction = `You are an expert AI workflow engineer for an n8n-style agent canvas. 
The user provides a prompt describing an action, agent, or transformation step they want to add to their workflow.
Generate a structured, modular node definition JSON object.
Make inputKeys and outputKeys clean, snake_case strings.
Make systemInstruction thorough so that when this node executes, it knows exactly how to process the inputs to generate the outputs.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptContext,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short title of node (1-4 words)" },
              nodeType: { type: Type.STRING, description: "agent, transformer, logic, or output" },
              description: { type: Type.STRING, description: "One sentence summary of function" },
              icon: { type: Type.STRING, description: "Icon key: bot, sparkles, filter, file-text, mail, code, database, shield, check-circle, terminal, zap, git-branch, share-2, brain, search, cpu, tags, table" },
              systemInstruction: { type: Type.STRING, description: "Detailed system instructions for executing this agent" },
              promptTemplate: { type: Type.STRING, description: "Optional template string" },
              inputKeys: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of input parameter names required (e.g. ['raw_text', 'query'])"
              },
              outputKeys: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of output parameter names produced (e.g. ['summary', 'sentiment', 'action_items'])"
              },
              jsonOutput: { type: Type.BOOLEAN, description: "Whether this node produces JSON output" },
              suggestedNextPrompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 follow-up prompts for what node the user might want to attach next"
              }
            },
            required: ["title", "nodeType", "description", "icon", "systemInstruction", "inputKeys", "outputKeys", "jsonOutput", "suggestedNextPrompts"]
          }
        }
      });

      const text = response.text || "{}";
      const nodeData = JSON.parse(text);
      res.json({ success: true, node: nodeData });
    } catch (err: any) {
      console.error("Error in /api/generate-node:", err);
      res.status(500).json({ error: err.message || "Failed to generate node" });
    }
  });

  // 1b. Endpoint to refine/edit existing node using AI prompt
  app.post("/api/refine-node", async (req, res) => {
    try {
      const { node, promptText } = req.body;
      if (!node || !promptText) {
        return res.status(400).json({ error: "node and promptText are required" });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are an AI Node Refinement Expert for an agentic workflow graph.
The user wants to update or modify an existing workflow node based on a natural language prompt.
Analyze the current node definition and the user's prompt (e.g. "extract line items into CSV", "add output port for total_price", "change to summary node").
Return an updated JSON definition for the node.
Ensure outputKeys contains any newly requested or implied dynamic output port names.`;

      const promptContext = `Current Node Definition:
Title: ${node.title}
Type: ${node.type}
Description: ${node.description}
Current User Instructions: ${node.userPrompt || ""}
Current Output Ports: ${JSON.stringify(node.outputs?.map((o: any) => o.name) || [])}
Current Input Ports: ${JSON.stringify(node.inputs?.map((i: any) => i.name) || [])}

User Refinement Request: "${promptText}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptContext,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              systemInstruction: { type: Type.STRING },
              userPrompt: { type: Type.STRING },
              outputKeys: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Updated list of dynamic output port names"
              },
              inputKeys: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              jsonOutput: { type: Type.BOOLEAN }
            },
            required: ["title", "description", "systemInstruction", "outputKeys", "inputKeys", "jsonOutput"]
          }
        }
      });

      const text = response.text || "{}";
      const refinedData = JSON.parse(text);
      res.json({ success: true, refinedNode: refinedData });
    } catch (err: any) {
      console.error("Error in /api/refine-node:", err);
      res.status(500).json({ error: err.message || "Failed to refine node" });
    }
  });

  // 1c. Endpoint to dynamically adapt node ports & system instructions via Gemini LLM
  app.post("/api/adapt-port", async (req, res) => {
    try {
      const { node, isOutput, oldPortName, newPortName, connectedNodeTypes } = req.body;
      if (!node || !newPortName) {
        return res.status(400).json({ error: "node and newPortName are required" });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are an AI Graph Architect & Data Schema Specialist for an agentic workflow execution engine.
The user is adding or renaming a port on a workflow node.
Node Context:
- Node Title: "${node.title}"
- Node Type: "${node.type}"
- Node Description: "${node.description || ''}"
- Current System Instructions: "${node.systemInstruction || node.config?.systemInstruction || ''}"
- Target Port Change: "${oldPortName || 'new_port'}" -> "${newPortName}" (${isOutput ? 'OUTPUT' : 'INPUT'} port)
- Connected Neighbor Node Types: ${JSON.stringify(connectedNodeTypes || [])}

Your tasks:
1. Clean and normalize the port name into a standardized key identifier (e.g. "extracted images" -> "extracted_images" or "images").
2. Adapt the node's system instructions so that when executed, the LLM node will generate/expect data matching this new key structure (e.g. if an output port is renamed to 'images' or 'extracted_tables', update instructions to extract those fields).
3. Check data flow feasibility (e.g., if passing PDF images to an image analyzer, confirm compatibility; if an impossible raw format conversion is attempted, set isValid to false and provide clear diagnostic advice).
4. Return:
   - adaptedPortName: clean identifier name for the port
   - dataType: inferred data type (e.g., "image_array", "pdf_document", "string", "json_object", "table_data")
   - updatedSystemInstruction: updated system instruction for the node
   - isValid: boolean indicating whether this data routing makes sense
   - adviceMessage: concise friendly message explaining what AI adapted or any helpful guidance for the user.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Analyze port change "${oldPortName}" -> "${newPortName}" for node "${node.title}".`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              adaptedPortName: { type: Type.STRING },
              dataType: { type: Type.STRING },
              updatedSystemInstruction: { type: Type.STRING },
              isValid: { type: Type.BOOLEAN },
              adviceMessage: { type: Type.STRING }
            },
            required: ["adaptedPortName", "dataType", "updatedSystemInstruction", "isValid", "adviceMessage"]
          }
        }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Error in /api/adapt-port:", err);
      // Clean fallback if API call fails
      const cleanName = req.body.newPortName ? req.body.newPortName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_') : 'port';
      res.json({
        success: true,
        adaptedPortName: cleanName,
        dataType: 'string',
        updatedSystemInstruction: req.body.node?.systemInstruction || '',
        isValid: true,
        adviceMessage: `Port renamed to ${cleanName}.`
      });
    }
  });

  // 2. Endpoint to execute an agent node
  app.post("/api/execute-node", async (req, res) => {
    const startTime = Date.now();
    try {
      const { node, inputValues } = req.body;
      if (!node) {
        return res.status(400).json({ error: "node definition is required" });
      }

      const ai = getGeminiClient();

      const nodeSystemInstruction = node.systemInstruction || node.config?.systemInstruction || "Process input and return relevant results.";
      const jsonOutput = node.config?.jsonOutput !== undefined ? node.config.jsonOutput : (node.outputs && node.outputs.length > 1);

      const docPayloads = (node.config?.documents || []).map((d: any) => `DOCUMENT ATTACHMENT [${d.name}]:\n${d.content}`).join('\n\n');

      const contentsPrompt = `
Input Data Provided To This Node:
${JSON.stringify(inputValues || node.inputValues || {}, null, 2)}

${docPayloads ? `Attached Files / Reference Documents On This Node:\n${docPayloads}\n` : ""}

Node Parameters / Prompt Instructions:
${node.userPrompt ? `Original Request: "${node.userPrompt}"` : ""}
${node.config?.promptTemplate ? `Template: "${node.config.promptTemplate}"` : ""}

Task: Process the input data and attached reference files strictly according to the System Instruction.
${jsonOutput ? `Format your output as a valid JSON object containing keys: ${JSON.stringify(node.outputKeys || node.outputs?.map((o: any) => o.name) || ["result"])}.` : `Return clear, comprehensive text output.`}
`;

      const modelName = node.config?.model || "gemini-3.6-flash";
      const temp = node.config?.temperature ?? 0.7;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsPrompt,
        config: {
          systemInstruction: nodeSystemInstruction,
          temperature: temp,
          ...(jsonOutput ? { responseMimeType: "application/json" } : {})
        }
      });

      const rawText = response.text || "";
      let outputData: Record<string, any> = {};

      if (jsonOutput) {
        try {
          outputData = JSON.parse(rawText);
        } catch (e) {
          outputData = { result: rawText };
        }
      } else {
        const primaryOutputKey = (node.outputKeys && node.outputKeys[0]) || (node.outputs && node.outputs[0]?.name) || "output";
        outputData = { [primaryOutputKey]: rawText };
      }

      const durationMs = Date.now() - startTime;
      res.json({
        success: true,
        outputValues: outputData,
        rawText,
        durationMs
      });
    } catch (err: any) {
      console.error("Error in /api/execute-node:", err);
      const durationMs = Date.now() - startTime;
      res.status(500).json({
        success: false,
        error: err.message || "Node execution failed",
        durationMs
      });
    }
  });

  // 3. Endpoint to generate full multi-node workflow preset from a prompt
  app.post("/api/generate-workflow", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "prompt is required" });
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Create a 3 to 4 node AI agent workflow for the user goal: "${prompt}".
First node must be a Trigger node (input prompt/data).
Subsequent nodes should be Agent or Transformer nodes chained together.
Return a structured workflow graph.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              workflowName: { type: Type.STRING },
              description: { type: Type.STRING },
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, description: "trigger, agent, logic, transformer, output" },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    systemInstruction: { type: Type.STRING },
                    inputKeys: { type: Type.ARRAY, items: { type: Type.STRING } },
                    outputKeys: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sampleInput: { type: Type.STRING }
                  },
                  required: ["id", "type", "title", "description", "icon", "systemInstruction", "inputKeys", "outputKeys"]
                }
              },
              connections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fromNodeId: { type: Type.STRING },
                    fromOutputKey: { type: Type.STRING },
                    toNodeId: { type: Type.STRING },
                    toInputKey: { type: Type.STRING }
                  },
                  required: ["fromNodeId", "fromOutputKey", "toNodeId", "toInputKey"]
                }
              }
            },
            required: ["workflowName", "description", "nodes", "connections"]
          }
        }
      });

      const text = response.text || "{}";
      res.json({ success: true, workflow: JSON.parse(text) });
    } catch (err: any) {
      console.error("Error in /api/generate-workflow:", err);
      res.status(500).json({ error: err.message || "Failed to generate workflow" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite middleware for development vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
