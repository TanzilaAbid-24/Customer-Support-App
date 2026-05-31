import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper interface for DB storage including embeddings
interface DBStorage {
  documents: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    embedding?: number[];
    createdAt: string;
    updatedAt: string;
  }>;
  inquiries: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    query: string;
    response: string;
    status: 'resolved' | 'escalated';
    sources: Array<{ id: string; title: string; score: number }>;
    createdAt: string;
    retrievalExplanation?: string;
    promptConstructed?: string;
  }>;
}

// Default documents to pre-populate the knowledge base
const DEFAULT_DOCUMENTS = [
  {
    id: "doc-refund",
    title: "Refund and Return Policy",
    content: "Customers can request a full refund for any physical or digital item within 30 days of initial purchase. Items must be unused and in their original condition. Virtual coins or in-game consumable purchases are final and non-refundable. All approved refunds are processed and credited back to the customer's original payment method within 5-7 business days. Custom-made or personalized items are strictly ineligible for refunds. Sale items can only be returned in exchange for electronic store credit.",
    category: "Billing & Sales",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "doc-shipping",
    title: "Shipping and Delivery Guidelines",
    content: "We provide free standard shipping on orders exceeding $50. For orders below $50, standard shipping is flat $5. Standard shipping deliveries typically take 3-5 business days. Express delivery guarantees arrival within 1-2 business days for a flat fee of $15. We ship globally to over 50 countries, with international shipping times extending from 7 to 14 business days. Order tracking links are sent via email within 24 hours of package dispatch.",
    category: "Support & Logistics",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "doc-sub-cancel",
    title: "Subscription Billing and Cancellation Process",
    content: "Subscribers can toggle off periodic billing or cancel their automatic subscriptions at any time via the billing preferences page under 'Profile Settings'. To avoid credit card charges for subsequent cycles, cancellation must occur at least 24 hours before the renewal date. Cancelling mid-tier guarantees continued premium features access until the current subscription period terminates. We do not provide partial-month prorated refunds for already completed premium periods.",
    category: "Billing & Sales",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "doc-pw-reset",
    title: "Account Password Troubleshooting and Recovery",
    content: "If you cannot recall your account password, select the 'Forgot Password' option present on our authentication screen. Input your verified login email, and we will automatically send an email containing a secure password reset link. This email token is strictly valid for 60 minutes. Check your spam and promotions folders if it does not arrive promptly. For account privacy and compliance, customer service agents are unable to change your password manually over live messaging or phone.",
    category: "Security & Tech",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "doc-troubleshooting",
    title: "Primary Application Connection Troubleshooting",
    content: "When encountering infinite loaders, generic error states, or broken interfaces, execute the following steps: First, refresh your page or try clearing cookies and browsing history. Second, test using Google Chrome incognito window or Safari. Third, disable custom VPN layouts, browser extensions, or ad-blocking software blocks. If connectivity problems persist, email tech-agents with accurate browser version descriptions and screenshot exports of developer console outputs.",
    category: "Security & Tech",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Read/write functions for local DB file
function readDB(): DBStorage {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to read db.json, resetting to default structure:", error);
  }
  const initial = { documents: DEFAULT_DOCUMENTS, inquiries: [] };
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
  return initial;
}

function writeDB(data: DBStorage) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to db.json:", error);
  }
}

// Lazy initialization of GoogleGenAI SDK client helper
let googleAIClient: GoogleGenAI | null = null;
function getGoogleAIClient(): GoogleGenAI {
  if (!googleAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Ensure you have added it to secrets or environment variables.");
    }
    googleAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return googleAIClient;
}

// Helper to calculate cosine similarity
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Embed text with fallback options
async function embedText(text: string): Promise<number[]> {
  const client = getGoogleAIClient();
  // Using recommended preview model for embeddings or text-embedding-004
  try {
    const response: any = await client.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: text,
    });
    if (response.embedding && response.embedding.values) {
      return response.embedding.values;
    }
    if (response.embeddings && response.embeddings.length > 0) {
      return response.embeddings[0].values;
    }
    if (response.embeddings && response.embeddings.values) {
      return response.embeddings.values;
    }
    throw new Error("No values returned in embedding response");
  } catch (err: any) {
    console.warn(`Embedding failed with gemini-embedding-2-preview, trying standard text-embedding-004: ${err.message}`);
    const response: any = await client.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    if (response.embedding && response.embedding.values) {
      return response.embedding.values;
    }
    if (response.embeddings && response.embeddings.length > 0) {
      return response.embeddings[0].values;
    }
    if (response.embeddings && response.embeddings.values) {
      return response.embeddings.values;
    }
    throw new Error("Embedding model execution failed completely.");
  }
}

// API Routes
// 1. Get database statistics & setup indicators
app.get("/api/db/stats", (req, res) => {
  try {
    const db = readDB();
    const total = db.documents.length;
    const embedded = db.documents.filter(d => d.embedding && d.embedding.length > 0).length;
    const apiKeySet = !!process.env.GEMINI_API_KEY;

    res.json({
      totalDocuments: total,
      totalWithEmbeddings: embedded,
      unembeddedCount: total - embedded,
      embeddingModel: "gemini-embedding-2-preview / text-embedding-004",
      apiKeySet
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Fetch all KB documents
app.get("/api/kb/documents", (req, res) => {
  try {
    const db = readDB();
    // Strip embedding values from general fetch to save bandwidth, but specify if it exists
    const cleanDocs = db.documents.map(d => ({
      id: d.id,
      title: d.title,
      content: d.content,
      category: d.category,
      hasEmbedding: !!(d.embedding && d.embedding.length > 0),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));
    res.json(cleanDocs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Add single KB Document and generate its embedding
app.post("/api/kb/documents", async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: "Missing required fields: title, content, and category are required." });
    }

    const db = readDB();
    const newDocId = `doc-${Date.now()}`;
    
    let embedding: number[] | undefined;
    let embedError: string | null = null;
    
    try {
      embedding = await embedText(content);
    } catch (e: any) {
      console.error(`Could not embed new document on insertion: ${e.message}`);
      embedError = e.message;
    }

    const newDoc = {
      id: newDocId,
      title,
      content,
      category,
      embedding,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.documents.push(newDoc);
    writeDB(db);

    res.status(201).json({
      success: true,
      document: {
        id: newDoc.id,
        title: newDoc.title,
        content: newDoc.content,
        category: newDoc.category,
        hasEmbedding: !!embedding,
        createdAt: newDoc.createdAt,
        updatedAt: newDoc.updatedAt
      },
      embedError
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update KB Document & re-embed
app.put("/api/kb/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const db = readDB();
    const docIndex = db.documents.findIndex(d => d.id === id);
    if (docIndex === -1) {
      return res.status(404).json({ error: "Document not found." });
    }

    let embedding: number[] | undefined;
    let embedError: string | null = null;
    try {
      embedding = await embedText(content);
    } catch (e: any) {
      console.error(`Could not update embedding for document ${id}: ${e.message}`);
      embedError = e.message;
    }

    db.documents[docIndex] = {
      ...db.documents[docIndex],
      title,
      content,
      category,
      embedding: embedding || db.documents[docIndex].embedding, // hold historical if fail
      updatedAt: new Date().toISOString()
    };

    writeDB(db);

    res.json({
      success: true,
      document: {
        id,
        title,
        content,
        category,
        hasEmbedding: !!embedding,
        updatedAt: db.documents[docIndex].updatedAt
      },
      embedError
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete KB Document
app.delete("/api/kb/documents/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const filtered = db.documents.filter(d => d.id !== id);
    if (filtered.length === db.documents.length) {
      return res.status(404).json({ error: "Document not found." });
    }
    db.documents = filtered;
    writeDB(db);
    res.json({ success: true, message: "Document deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Ingest/re-index embeddings for all documents that do not have them
app.post("/api/kb/index-all", async (req, res) => {
  try {
    const db = readDB();
    let indexedCount = 0;
    const errors: string[] = [];

    for (let doc of db.documents) {
      if (!doc.embedding || doc.embedding.length === 0) {
        try {
          doc.embedding = await embedText(doc.content);
          doc.updatedAt = new Date().toISOString();
          indexedCount++;
        } catch (err: any) {
          errors.push(`Document ${doc.title}: ${err.message}`);
        }
      }
    }

    if (indexedCount > 0) {
      writeDB(db);
    }

    res.json({
      success: true,
      indexedCount,
      totalDocuments: db.documents.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Reset KB Store to default templates
app.post("/api/kb/reset", async (req, res) => {
  try {
    const freshDocs = DEFAULT_DOCUMENTS.map(doc => ({ ...doc }));
    const initial = { documents: freshDocs, inquiries: [] };
    writeDB(initial);
    res.json({ success: true, message: "Knowledge Base and Inquiry database reset successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Fetch Support inquiries history
app.get("/api/support/inquiries", (req, res) => {
  try {
    const db = readDB();
    res.json(db.inquiries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Reset Inquiries logs
app.post("/api/support/inquiries/clear", (req, res) => {
  try {
    const db = readDB();
    db.inquiries = [];
    writeDB(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Automated Customer Support LangChain-style RAG Agent
app.post("/api/support/inquiries", async (req, res) => {
  try {
    const { customerName, customerEmail, query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "Customer query must not be empty." });
    }

    const finalCustomerName = customerName || "Guest User";
    const finalCustomerEmail = customerEmail || "guest@example.com";

    const db = readDB();

    // LangChain Simulation Step 1: Create Query Embedding
    let queryEmbedding: number[] = [];
    let similarityExplanation = "Bypassing Vector DB (no API key or embedding failed)";
    let matchedSources: Array<{ id: string; title: string; score: number }> = [];
    let matchedDocsContext = "";

    try {
      queryEmbedding = await embedText(query);
    } catch (e: any) {
      console.warn(`Query embedding failed, executing standard zero-shot model backup: ${e.message}`);
      similarityExplanation = `Bypassing Vector similarity: ${e.message}`;
    }

    // LangChain Simulation Step 2: Vector Search with Cosine Similarity
    if (queryEmbedding && queryEmbedding.length > 0) {
      const candidates = db.documents
        .filter(d => d.embedding && d.embedding.length > 0)
        .map(doc => {
          const score = calculateCosineSimilarity(queryEmbedding, doc.embedding!);
          return {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            score
          };
        });

      // Sort by cosine similarity highest to lowest
      candidates.sort((x, y) => y.score - x.score);

      // Take standard LangChain RAG top-3 sources with similarity higher than 0.35 (to prevent absolute mismatch)
      const topKMatches = candidates.filter(c => c.score >= 0.30).slice(0, 3);
      
      matchedSources = topKMatches.map(m => ({
        id: m.id,
        title: m.title,
        score: parseFloat(m.score.toFixed(4))
      }));

      if (topKMatches.length > 0) {
        matchedDocsContext = topKMatches.map(m => `--- SOURCE: ${m.title} ---\n${m.content}`).join("\n\n");
        similarityExplanation = `Successfully generated query embedding. Isolated ${db.documents.filter(d => d.embedding).length} vectorized articles, retrieved ${topKMatches.length} matching fragments utilizing a similarity threshold of >= 0.30. Top match: ${topKMatches[0].title} with Similarity Score ${topKMatches[0].score.toFixed(4)}.`;
      } else {
        similarityExplanation = `Embedded query successfully, but no matching articles exceeded the 0.30 similarity threshold. Resorting to zero-shot knowledge fallback.`;
      }
    } else {
      // If no vectors are present, let's run clean substring matching as basic keyword retrieval fallback!
      const keywordMatches = db.documents.filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase()) || 
        doc.content.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 2);

      if (keywordMatches.length > 0) {
        matchedSources = keywordMatches.map(k => ({ id: k.id, title: k.title, score: 0.5 }));
        matchedDocsContext = keywordMatches.map(m => `--- KEYWORD SOURCE: ${m.title} ---\n${m.content}`).join("\n\n");
        similarityExplanation = `Could not generate query embedding. Fallback keyword lookup matched ${keywordMatches.length} articles containing terms.`;
      }
    }

    // LangChain Simulation Step 3: Prompt Template Compilation
    const systemPrompt = `You are a polite, helpful, and skilled customer support representative for our company, Acme Commerce.
Your objective is to answer customers' inquiries professionally using exclusively the verified company rules provided in the context below.

Context constraints:
1. Always base your replies on the retrieved context documents provided below.
2. If the context does not contain relevant information, politely inform the customer that you don't have the definitive guidelines for that particular topic and suggest escalating to a human team member. Do not invent details.
3. Be friendly, structured (use bullet points if helpful), and concise. Address the customer by name.

Retrieved Context:
${matchedDocsContext || "No official document context was retrieved from the vector store."}

Customer Information:
Name: ${finalCustomerName}
Email: ${finalCustomerEmail}`;

    // LangChain Simulation Step 4: Generative QA Call
    const client = getGoogleAIClient();
    let generatedAnswer = "";
    let isEscalated = false;

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: query,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3 // Low temperature is optimal for truthful customer support replies
        }
      });
      generatedAnswer = response.text || "No reply generated.";
    } catch (apiError: any) {
      console.error(`Gemini QA generation error: ${apiError.message}`);
      generatedAnswer = `Hello ${finalCustomerName},\n\nWe apologize, but our automatic answering engine encountered an internal processing error (${apiError.message}). We have flagged this error and escalated your inquiry to our active customer support unit. A representative will contact you via ${finalCustomerEmail} shortly.`;
      isEscalated = true;
    }

    // Simple automatic escalation rule: if agent indicates need for human support or says they can't help
    if (generatedAnswer.toLowerCase().includes("escalate") || 
        generatedAnswer.toLowerCase().includes("human representative") || 
        generatedAnswer.toLowerCase().includes("support team") || 
        isEscalated) {
      isEscalated = true;
    }

    const newInquiry = {
      id: `inq-${Date.now()}`,
      customerName: finalCustomerName,
      customerEmail: finalCustomerEmail,
      query,
      response: generatedAnswer,
      status: (isEscalated ? 'escalated' : 'resolved') as 'resolved' | 'escalated',
      sources: matchedSources,
      createdAt: new Date().toISOString(),
      retrievalExplanation: similarityExplanation,
      promptConstructed: systemPrompt
    };

    db.inquiries.unshift(newInquiry);
    writeDB(db);

    res.status(201).json(newInquiry);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite middleware or static serving
async function setupApp() {
  // Read database initially to make sure db.json exists with defaults
  readDB();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT} under ${process.env.NODE_ENV || 'development'} mode`);
  });
}

setupApp().catch(err => {
  console.error("Failed to start server:", err);
});
