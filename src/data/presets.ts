import { PresetWorkflow } from '../types';

export const INITIAL_PRESETS: PresetWorkflow[] = [
  {
    id: 'market-research',
    name: 'Market Research & Sentiment Pipeline',
    category: 'Analysis',
    description: 'Ingests raw customer feedback or product notes, extracts key insights, evaluates risk, and generates an executive briefing.',
    nodes: [
      {
        id: 'node-trigger-1',
        type: 'trigger',
        title: 'Workflow Trigger',
        description: 'Initial input data stream for customer feedback',
        icon: 'terminal',
        x: 80,
        y: 220,
        status: 'idle',
        inputs: [],
        outputs: [
          { id: 'out-raw_text', name: 'raw_text', type: 'string' },
          { id: 'out-document_text', name: 'document_text', type: 'string' },
          { id: 'out-document_name', name: 'document_name', type: 'string' }
        ],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.7,
          jsonOutput: false,
          schedule: {
            enabled: true,
            type: 'interval',
            frequency: '15m',
            lastRun: '12:00:00 PM',
            nextRun: '12:15:00 PM'
          },
          documents: [
            {
              id: 'doc-101',
              name: 'Q4_Customer_Feedback_Transcript.pdf',
              size: 18400,
              type: 'application/pdf',
              content: `Q4 Customer Feedback Transcript & User Interviews:
- Client Enterprise-A: Loved sub-second latency in cloud database queries. However, complained that RBAC role permissions are cumbersome to configure.
- Client Growth-B: Pricing tiers need higher concurrency caps for automated batch workflows.
- Client Startup-C: Requested automated document parsing triggers for incoming support tickets.`,
              uploadedAt: 'Today at 11:45 AM'
            }
          ]
        },
        inputValues: {},
        outputValues: {
          raw_text: `Our team launched the new cloud database dashboard v2.0 last week. Customers love the sub-second query latency and instant live sync, but 3 enterprise clients reported confusion with the workspace permissions settings. Also, pricing plans feel slightly ambiguous for high-concurrency usage.`,
          document_text: `Q4 Customer Feedback Transcript & User Interviews:\n- Client Enterprise-A: Loved sub-second latency in cloud database queries. However, complained that RBAC role permissions are cumbersome to configure.\n- Client Growth-B: Pricing tiers need higher concurrency caps for automated batch workflows.\n- Client Startup-C: Requested automated document parsing triggers for incoming support tickets.`,
          document_name: `Q4_Customer_Feedback_Transcript.pdf`
        },
        suggestedNextPrompts: [
          'Extract key features, positive praise, and customer pain points',
          'Evaluate customer sentiment score and churn risk level',
          'Draft an urgent email update for the product team'
        ]
      },
      {
        id: 'node-agent-1',
        type: 'agent',
        title: 'Insight & Pain Point Extractor',
        description: 'Analyzes customer feedback to isolate praise, friction, and feature requests.',
        icon: 'brain',
        x: 480,
        y: 120,
        status: 'idle',
        inputs: [{ id: 'in-raw_text', name: 'raw_text', type: 'string' }],
        outputs: [
          { id: 'out-highlights', name: 'highlights', type: 'string' },
          { id: 'out-pain_points', name: 'pain_points', type: 'string' },
          { id: 'out-sentiment_score', name: 'sentiment_score', type: 'string' }
        ],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.5,
          jsonOutput: true,
          systemInstruction: 'You are a Senior Product Analyst. Analyze the provided customer text. Output JSON containing "highlights" (bullet points of praise), "pain_points" (friction items), and "sentiment_score" (score from 0.0 to 1.0).'
        },
        userPrompt: 'Extract key praise highlights, pain points, and overall sentiment score.',
        inputValues: {},
        outputValues: {},
        suggestedNextPrompts: [
          'Perform a SWOT analysis based on these pain points',
          'Generate customer response templates for support agents',
          'Create Jira tickets format for the friction items'
        ]
      },
      {
        id: 'node-agent-2',
        type: 'agent',
        title: 'Executive Briefing & Action Plan',
        description: 'Synthesizes extraction results into a formatted C-suite report.',
        icon: 'file-text',
        x: 900,
        y: 220,
        status: 'idle',
        inputs: [
          { id: 'in-highlights', name: 'highlights', type: 'string' },
          { id: 'in-pain_points', name: 'pain_points', type: 'string' },
          { id: 'in-sentiment_score', name: 'sentiment_score', type: 'string' }
        ],
        outputs: [{ id: 'out-executive_report', name: 'executive_report', type: 'string' }],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.7,
          jsonOutput: false,
          systemInstruction: 'You are an Executive Assistant. Using highlights, pain points, and sentiment score, draft a high-impact executive summary markdown report with recommended action items for engineering and marketing.'
        },
        userPrompt: 'Synthesize highlights and pain points into an Executive Summary report with action items.',
        inputValues: {},
        outputValues: {},
        suggestedNextPrompts: [
          'Translate this executive report into Spanish & German',
          'Draft a Slack announcement message to #product-launch channel',
          'Generate a high-priority bug remediation checklist'
        ]
      }
    ],
    connections: [
      {
        id: 'conn-1',
        fromNodeId: 'node-trigger-1',
        fromPortId: 'out-raw_text',
        toNodeId: 'node-agent-1',
        toPortId: 'in-raw_text'
      },
      {
        id: 'conn-2',
        fromNodeId: 'node-agent-1',
        fromPortId: 'out-highlights',
        toNodeId: 'node-agent-2',
        toPortId: 'in-highlights'
      },
      {
        id: 'conn-3',
        fromNodeId: 'node-agent-1',
        fromPortId: 'out-pain_points',
        toNodeId: 'node-agent-2',
        toPortId: 'in-pain_points'
      },
      {
        id: 'conn-4',
        fromNodeId: 'node-agent-1',
        fromPortId: 'out-sentiment_score',
        toNodeId: 'node-agent-2',
        toPortId: 'in-sentiment_score'
      }
    ]
  },
  {
    id: 'content-engine',
    name: 'Multi-Channel Content Generation Engine',
    category: 'Marketing',
    description: 'Chains ideation, technical writing, translation, and social media posting from a single prompt node.',
    nodes: [
      {
        id: 'node-trigger-content',
        type: 'trigger',
        title: 'Topic Prompt Trigger',
        description: 'Seed topic or campaign goal',
        icon: 'sparkles',
        x: 80,
        y: 200,
        status: 'idle',
        inputs: [],
        outputs: [
          { id: 'out-topic', name: 'topic', type: 'string' },
          { id: 'out-document_text', name: 'document_text', type: 'string' },
          { id: 'out-document_name', name: 'document_name', type: 'string' }
        ],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.8,
          jsonOutput: false,
          schedule: {
            enabled: true,
            type: 'cron',
            frequency: 'cron',
            cronExpression: '0 9 * * 1', // Weekly Mon 9am
            lastRun: 'Mon 09:00 AM',
            nextRun: 'Next Mon 09:00 AM'
          },
          documents: [
            {
              id: 'doc-102',
              name: 'Product_Brief_Agents_v2.md',
              size: 8900,
              type: 'text/markdown',
              content: `# Product Release Brief: Autonomous Agent Node Builder
## Target Audience
Technical leaders, DevOps engineers, and Growth Marketers looking for dynamic AI agent execution graphs.

## Core Differentiators
1. Prompt-to-Node synthesis using Gemini 3.6 Flash
2. Automated scheduler triggers & document intake pipelines
3. Instant visual execution trace logs`,
              uploadedAt: 'Yesterday'
            }
          ]
        },
        inputValues: {},
        outputValues: {
          topic: 'Why AI Agents with natural language workflow builders are replacing rigid Zapier zaps for tech teams',
          document_text: `# Product Release Brief: Autonomous Agent Node Builder\n## Target Audience\nTechnical leaders, DevOps engineers, and Growth Marketers looking for dynamic AI agent execution graphs.\n\n## Core Differentiators\n1. Prompt-to-Node synthesis using Gemini 3.6 Flash\n2. Automated scheduler triggers & document intake pipelines\n3. Instant visual execution trace logs`,
          document_name: 'Product_Brief_Agents_v2.md'
        },
        suggestedNextPrompts: [
          'Write a detailed technical blog post with architectural diagrams',
          'Generate 5 viral Twitter/X hook variations',
          'Outline a podcast script explaining prompt-driven agent nodes'
        ]
      },
      {
        id: 'node-agent-article',
        type: 'agent',
        title: 'Technical Blog Article Author',
        description: 'Drafts a structured, compelling engineering article.',
        icon: 'code',
        x: 480,
        y: 100,
        status: 'idle',
        inputs: [{ id: 'in-topic', name: 'topic', type: 'string' }],
        outputs: [{ id: 'out-article_md', name: 'article_md', type: 'string' }],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.7,
          jsonOutput: false,
          systemInstruction: 'You are a Principal Developer Advocate. Write a engaging technical blog post in Markdown based on the topic. Include clear headers, code concept snippets, and real-world advantages.'
        },
        userPrompt: 'Write a comprehensive technical blog post with key advantages and workflow examples.',
        inputValues: {},
        outputValues: {},
        suggestedNextPrompts: [
          'Generate social media posts for Twitter, LinkedIn, and Threads',
          'Summarize into a 3-bullet executive teaser for newsletter',
          'Translate article into Japanese and Portuguese'
        ]
      },
      {
        id: 'node-agent-social',
        type: 'agent',
        title: 'Multi-Channel Social Snippets',
        description: 'Creates optimized copy for LinkedIn, X (Twitter), and Newsletters.',
        icon: 'share-2',
        x: 900,
        y: 220,
        status: 'idle',
        inputs: [{ id: 'in-article_md', name: 'article_md', type: 'string' }],
        outputs: [
          { id: 'out-linkedin_post', name: 'linkedin_post', type: 'string' },
          { id: 'out-tweet_thread', name: 'tweet_thread', type: 'string' },
          { id: 'out-newsletter_blurb', name: 'newsletter_blurb', type: 'string' }
        ],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.8,
          jsonOutput: true,
          systemInstruction: 'You are a Growth Marketing Agent. Given the technical article markdown, output JSON with "linkedin_post" (professional tone with emojis), "tweet_thread" (3-part tweet thread), and "newsletter_blurb" (concise email section).'
        },
        userPrompt: 'Adapt article into LinkedIn post, Twitter thread, and Newsletter blurb.',
        inputValues: {},
        outputValues: {},
        suggestedNextPrompts: [
          'Generate image generation prompts for social cover art',
          'Create bulleted Q&A for community discussion forum',
          'Evaluate readability grade level and tone balance'
        ]
      }
    ],
    connections: [
      {
        id: 'conn-c1',
        fromNodeId: 'node-trigger-content',
        fromPortId: 'out-topic',
        toNodeId: 'node-agent-article',
        toPortId: 'in-topic'
      },
      {
        id: 'conn-c2',
        fromNodeId: 'node-agent-article',
        fromPortId: 'out-article_md',
        toNodeId: 'node-agent-social',
        toPortId: 'in-article_md'
      }
    ]
  },
  {
    id: 'pdf-csv-audit',
    name: 'PDF Intake to CSV & Reference Comparison Pipeline',
    category: 'Document Automation',
    description: 'Ingests a PDF invoice report on Node 1, converts tabular data into CSV on Node 2, and compares against a reference price list attached to Node 3.',
    nodes: [
      {
        id: 'pdf-node-1',
        type: 'trigger',
        title: 'PDF Document Intake (Node 1)',
        description: 'Ingests PDF invoice report with line items',
        icon: 'file-text',
        x: 80,
        y: 180,
        status: 'idle',
        inputs: [],
        outputs: [
          { id: 'out-document_text', name: 'document_text', type: 'string' },
          { id: 'out-document_name', name: 'document_name', type: 'string' }
        ],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.2,
          jsonOutput: false,
          documents: [
            {
              id: 'doc-pdf-inv-01',
              name: 'Q4_Vendor_Invoice_Report.pdf',
              size: 24500,
              type: 'application/pdf',
              content: `Q4 VENDOR INVOICE REPORT - ACME SUPPLY CO.
Invoice #: INV-2026-9902
Date: Oct 15, 2026

Line Items:
Item ID | Description           | Qty | Billed Unit Price ($)
ITEM-01 | Cloud Compute Server  | 10  | 150.00
ITEM-02 | Database Storage 1TB  | 5   | 85.00
ITEM-03 | Premium API Gateway   | 2   | 340.00
ITEM-04 | Security Sentinel     | 4   | 190.00`,
              uploadedAt: 'Today'
            }
          ]
        },
        inputValues: {},
        outputValues: {
          document_name: 'Q4_Vendor_Invoice_Report.pdf',
          document_text: `Q4 VENDOR INVOICE REPORT - ACME SUPPLY CO.
Invoice #: INV-2026-9902
Date: Oct 15, 2026

Line Items:
Item ID | Description           | Qty | Billed Unit Price ($)
ITEM-01 | Cloud Compute Server  | 10  | 150.00
ITEM-02 | Database Storage 1TB  | 5   | 85.00
ITEM-03 | Premium API Gateway   | 2   | 340.00
ITEM-04 | Security Sentinel     | 4   | 190.00`
        },
        suggestedNextPrompts: ['Extract table into clean CSV format']
      },
      {
        id: 'pdf-node-2',
        type: 'transformer',
        title: 'Extract to CSV (Node 2)',
        description: 'Parses PDF text and formats structured data as a standard CSV string.',
        icon: 'table',
        x: 480,
        y: 180,
        status: 'idle',
        inputs: [{ id: 'in-document_text', name: 'document_text', type: 'string' }],
        outputs: [
          { id: 'out-extracted_csv', name: 'extracted_csv', type: 'string' },
          { id: 'out-item_count', name: 'item_count', type: 'string' }
        ],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.1,
          jsonOutput: true,
          systemInstruction: 'You are a Document Parsing Engine. Extract all line items from the PDF input text. Return a JSON object containing "extracted_csv" (a clean RFC-4180 CSV string with header: item_id,description,quantity,billed_price) and "item_count".'
        },
        userPrompt: 'Extract all invoice line items from PDF text into CSV format.',
        inputValues: {},
        outputValues: {},
        suggestedNextPrompts: ['Compare extracted CSV against reference rate list']
      },
      {
        id: 'pdf-node-3',
        type: 'agent',
        title: 'CSV Audit vs Reference (Node 3)',
        description: 'Receives extracted CSV from Node 2 and compares line prices against a reference rate file attached to Node 3.',
        icon: 'shield',
        x: 880,
        y: 180,
        status: 'idle',
        inputs: [{ id: 'in-extracted_csv', name: 'extracted_csv', type: 'string' }],
        outputs: [
          { id: 'out-audit_summary', name: 'audit_summary', type: 'string' },
          { id: 'out-discrepancies', name: 'discrepancies', type: 'string' },
          { id: 'out-total_overcharge', name: 'total_overcharge', type: 'string' }
        ],
        config: {
          model: 'gemini-3.6-flash',
          temperature: 0.3,
          jsonOutput: true,
          documents: [
            {
              id: 'doc-ref-rates-csv',
              name: 'approved_contract_rates_reference.csv',
              size: 4200,
              type: 'text/csv',
              content: `item_id,approved_rate_usd
ITEM-01,140.00
ITEM-02,80.00
ITEM-03,340.00
ITEM-04,175.00`,
              uploadedAt: 'Attached on Node 3'
            }
          ],
          systemInstruction: 'You are a Senior Financial Audit Agent. You receive an incoming extracted CSV from Node 2 and have an approved rate reference CSV attached to Node 3. Compare the billed prices against approved rates. Output JSON with "audit_summary", "discrepancies" (list items billed over contract rate), and "total_overcharge".'
        },
        userPrompt: 'Compare incoming CSV against reference contract rates CSV attached on Node 3 and flag overcharges.',
        inputValues: {},
        outputValues: {},
        suggestedNextPrompts: ['Generate vendor refund request letter']
      }
    ],
    connections: [
      {
        id: 'conn-pdf-1',
        fromNodeId: 'pdf-node-1',
        fromPortId: 'out-document_text',
        toNodeId: 'pdf-node-2',
        toPortId: 'in-document_text'
      },
      {
        id: 'conn-pdf-2',
        fromNodeId: 'pdf-node-2',
        fromPortId: 'out-extracted_csv',
        toNodeId: 'pdf-node-3',
        toPortId: 'in-extracted_csv'
      }
    ]
  }
];
