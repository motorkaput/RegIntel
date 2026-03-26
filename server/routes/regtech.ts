import type { Express } from "express";
import { storage } from "../storage";
import multer from "multer";
import { parseDocument } from "../services/documentParser";
import { chunkAndEmbed } from "../services/regTechEmbeddings";
import { retrieveContext } from "../services/regTechRetrieval";
import { extractDocumentMetadata } from "../services/regTechMetadataExtraction";
import OpenAI from "openai";
import { 
  insertRegulatoryDocumentSchema, 
  insertObligationSchema, 
  regtechUsers, 
  regtechOrganizations,
  regulations,
  regulationVersions,
  legalUnits,
  regulatoryObligations,
  aiAuditLog,
  users,
  complianceControls,
  complianceEvidence,
  obligationMappings,
  obligations,
  regulatoryDocuments
} from "@shared/schema";
import { db } from "../db";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { eq, and, sql, count } from "drizzle-orm";
import { z } from "zod";
import { 
  createRegulationFromDocument, 
  processRegulation, 
  reprocessExistingDocument,
  ensureRulePackExists 
} from '../services/regulationProcessing';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Rate limiter for AI endpoints (10 requests per minute per user)
const aiRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function aiRateLimit(req: any, res: any, next: any) {
  const key = `${req.session?.userId || req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  const entry = aiRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    aiRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= maxRequests) {
    return res.status(429).json({ message: 'Rate limit exceeded. Please wait before making another AI request.' });
  }
  entry.count++;
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiRateLimitMap) {
    if (now > entry.resetAt) aiRateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

function sanitizeLLMResponse(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/…/g, '...')
    .replace(/•/g, '-')
    .replace(/`/g, "'")
    .replace(/^(Certainly|Great|Excellent|Sure|Of course|Absolutely)[!,.]\s*/gmi, '')
    .replace(/^(I'd be happy to|I'll|Let me|I can)[^.!?]*[.!?]\s*/gmi, '')
    .trim();
}

async function classifyDocument(text: string, filename: string): Promise<{ classification: string; confidence: number }> {
  try {
    const sampleText = text.slice(0, 6000);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a document classifier for regulatory and legal documents. Classify the document into one of these categories:
- regulatory: Government regulations, regulatory guidance, rules issued by financial regulators (FCA, SEC, FinCEN, MAS, etc.)
- legal: Legal statutes, laws, court rulings, legal opinions, contracts
- guidance: Non-binding guidance, best practices, industry standards, FAQs
- policy: Internal policies, procedures, compliance manuals
- other: Documents that don't fit the above categories

Respond with JSON only: {"classification": "category", "confidence": 0.95}`
        },
        {
          role: 'user',
          content: `Classify this document:\nFilename: ${filename}\n\nContent:\n${sampleText}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      classification: result.classification || 'other',
      confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
    };
  } catch (error) {
    console.error('Document classification error:', error);
    return { classification: 'other', confidence: 0.5 };
  }
}

export function registerRegTechRoutes(app: Express) {
  
  app.post('/api/regtech/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log(`Upload started: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB, type: ${req.file.mimetype})`);

      const { 
        jurisdiction, 
        regulator, 
        instrumentType,
        publishedAt,
        effectiveAt,
        url,
        title
      } = req.body;

      let parsed;
      try {
        parsed = await parseDocument(req.file.buffer, req.file.mimetype);
        console.log(`Document parsed successfully: ${parsed.text.length} characters extracted`);
      } catch (parseError) {
        const errMsg = parseError instanceof Error ? parseError.message : String(parseError);
        console.error(`Document parsing failed for ${req.file.originalname}:`, errMsg);
        return res.status(400).json({ message: `Failed to parse document: ${errMsg}` });
      }

      const existingDoc = await storage.getRegulatoryDocumentByHash(parsed.hash, req.session.userId);
      if (existingDoc) {
        return res.json({
          message: 'Document already exists in your library',
          documentId: existingDoc.id,
          status: existingDoc.status,
        });
      }

      let finalMetadata = {
        title: title || parsed.metadata.title || req.file.originalname,
        jurisdiction: jurisdiction || null,
        regulator: regulator || null,
        instrumentType: instrumentType || null,
        publishedAt: publishedAt || null,
        effectiveAt: effectiveAt || null,
      };

      if (!finalMetadata.jurisdiction || !finalMetadata.regulator) {
        console.log('Auto-extracting metadata using AI...');
        const extracted = await extractDocumentMetadata(parsed.text, req.file.originalname);
        
        if (!extracted.isComplianceRelated) {
          return res.status(400).json({ 
            message: 'This document does not appear to be compliance or regulatory related. Please upload only regulatory documents such as regulations, guidance, directives, or compliance-related materials.',
            isNotCompliance: true,
          });
        }
        
        finalMetadata.title = finalMetadata.title || extracted.title;
        finalMetadata.jurisdiction = finalMetadata.jurisdiction || extracted.jurisdiction;
        finalMetadata.regulator = finalMetadata.regulator || extracted.regulator;
        finalMetadata.instrumentType = finalMetadata.instrumentType || extracted.instrumentType;
        finalMetadata.publishedAt = finalMetadata.publishedAt || extracted.publishedAt;
        finalMetadata.effectiveAt = finalMetadata.effectiveAt || extracted.effectiveAt;
        
        console.log('Extracted metadata:', extracted);
      }

      if (!finalMetadata.jurisdiction || !finalMetadata.regulator) {
        return res.status(400).json({ 
          message: 'Could not determine jurisdiction and regulator from document. Please provide them manually.',
          extracted: finalMetadata,
        });
      }

      console.log('Classifying document...');
      const classification = await classifyDocument(parsed.text, req.file.originalname);
      console.log(`Document classified as: ${classification.classification} (confidence: ${classification.confidence})`);

      const document = await storage.createRegulatoryDocument({
        title: finalMetadata.title,
        originalFilename: req.file.originalname,
        url: url || null,
        jurisdiction: finalMetadata.jurisdiction,
        regulator: finalMetadata.regulator,
        instrumentType: finalMetadata.instrumentType || null,
        publishedAt: finalMetadata.publishedAt ? new Date(finalMetadata.publishedAt) : null,
        effectiveAt: finalMetadata.effectiveAt ? new Date(finalMetadata.effectiveAt) : null,
        status: 'processing',
        contentHash: parsed.hash,
        extractedText: parsed.text,
        metadata: { ...parsed.metadata, autoExtracted: !jurisdiction || !regulator },
        uploadedBy: req.session.userId,
        classification: classification.classification,
        classificationConfidence: String(classification.confidence),
      });

      res.status(202).json({ 
        message: 'Document processing started',
        documentId: document.id,
        status: 'processing'
      });

      (async () => {
        try {
          const embeddedChunks = await chunkAndEmbed(parsed.text);

          const chunks = embeddedChunks.map(chunk => ({
            docId: document.id,
            ordinal: chunk.ordinal,
            text: chunk.text,
            tokens: chunk.tokens,
            embedding: chunk.embedding,
            sectionRef: chunk.sectionRef,
            metadata: {},
          }));

          await storage.createDocumentChunks(chunks);

          const obligations = await extractObligations(document.id, parsed.text, jurisdiction, regulator);
          
          console.log(`Persisted ${obligations.length} obligations to database`);

          const summary = await generateDocumentSummary(parsed.text, finalMetadata.title, jurisdiction, regulator);

          await storage.updateRegulatoryDocument(document.id, {
            status: 'active',
            metadata: {
              ...(document.metadata || {}),
              summary,
            } as any,
          });

          await generateAlertsForNewDocument(document, obligations, req.session.userId);

          console.log('Document processing complete:', document.id);
        } catch (error) {
          console.error('Background processing error:', error);
          
          await storage.updateRegulatoryDocument(document.id, {
            status: 'failed',
            metadata: { 
              ...(document.metadata || {}),
              processingError: error instanceof Error ? error.message : String(error)
            } as any
          });
        }
      })();

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Upload failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/document/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const document = await storage.getRegulatoryDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({
        id: document.id,
        status: document.status,
        title: document.title,
        error: (document.metadata as any)?.processingError,
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ 
        message: 'Failed to check status',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/query', isAuthenticated, aiRateLimit, async (req: any, res) => {
    try {
      const querySchema = z.object({
        query: z.string().min(1, 'Query is required').max(2000),
        jurisdiction: z.string().optional(),
        regulator: z.string().optional(),
        docId: z.union([z.string(), z.number()]).optional(),
        docIds: z.array(z.union([z.string(), z.number()])).optional(),
        includeOrganization: z.boolean().optional(),
      });
      const validation = querySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }
      const { query, jurisdiction, regulator, docId, docIds: requestDocIds, includeOrganization } = validation.data;
      const userId = req.session.userId;

      let docIds: number[] | undefined;
      let userIds: string[] | undefined;
      let scopeUserId: string | undefined;

      // Support both single docId (legacy) and multiple docIds (array)
      const selectedDocIds: number[] = [];
      if (requestDocIds && Array.isArray(requestDocIds) && requestDocIds.length > 0) {
        selectedDocIds.push(...requestDocIds.map((id: any) => parseInt(id)));
      } else if (docId && String(docId) !== 'all') {
        selectedDocIds.push(parseInt(String(docId)));
      }

      if (selectedDocIds.length > 0) {
        // Verify user has access to all selected documents
        for (const id of selectedDocIds) {
          const selectedDoc = await storage.getRegulatoryDocument(id);
          if (!selectedDoc || selectedDoc.uploadedBy !== userId) {
            return res.status(403).json({ message: 'You do not have access to one or more selected documents' });
          }
        }
        docIds = selectedDocIds;
      } else if (includeOrganization) {
        const regtechUser = await storage.getRegtechUser(userId);
        if (!regtechUser?.organizationId) {
          return res.status(403).json({ message: 'Organization access not authorized' });
        }
        const orgUsers = await storage.getRegtechOrganizationUsers(regtechUser.organizationId);
        userIds = orgUsers.map(u => u.id);
      } else {
        scopeUserId = userId;
      }

      // Detect queries that need full document context (summaries, comparisons, differences)
      const fullContextKeywords = [
        'summarize', 'summary', 'summarise', 'overview', 'key points', 'main points', 
        'what is this document about', 'explain the document',
        'difference', 'differences', 'compare', 'comparison', 'between', 'versus', 'vs',
        'changed', 'changes', 'evolution', 'how has', 'what changed'
      ];
      const isSummaryQuery = fullContextKeywords.some(kw => query.toLowerCase().includes(kw));
      
      let context: string;
      let sources: Array<{
        documentId: number;
        documentTitle: string;
        originalFilename?: string;
        chunkId: number;
        sectionRef?: string;
        url?: string;
        score: number;
        text: string;
        regulator: string;
      }>;
      
      if (isSummaryQuery) {
        // For summary/comparison queries, load full document text
        let docsToLoad: number[] = [];
        
        if (docIds && docIds.length > 0) {
          // Use explicitly selected documents
          docsToLoad = docIds;
          console.log(`Summary/comparison query - loading full text for ${docIds.length} selected document(s)`);
        } else {
          // No specific docs selected - first retrieve relevant docs, then load their full text
          console.log(`Summary/comparison query without specific docs - finding relevant documents`);
          const retrieved = await retrieveContext(query, {
            jurisdiction,
            regulator,
            userId: scopeUserId,
            docIds: undefined,
            userIds,
          }, 15);
          
          // Get unique document IDs from retrieved chunks
          const uniqueDocIds = [...new Set(retrieved.sources.map(s => s.documentId))];
          // Load full text for top 4 most relevant documents
          docsToLoad = uniqueDocIds.slice(0, 4);
          console.log(`Found ${uniqueDocIds.length} unique docs, loading full text for top ${docsToLoad.length}`);
        }
        
        const docs = await Promise.all(docsToLoad.map(id => storage.getRegulatoryDocument(id)));
        const validDocs = docs.filter(d => d !== undefined);
        
        const contextParts: string[] = [];
        sources = [];
        
        for (const doc of validDocs) {
          const fullText = doc.extractedText || '';
          // Limit each doc to 20000 chars for comparison queries
          const truncatedText = fullText.length > 20000 
            ? fullText.substring(0, 20000) + '\n\n[Document truncated for length...]' 
            : fullText;
          
          contextParts.push(`[FULL DOCUMENT: ${doc.title}]\n${truncatedText}`);
          sources.push({
            documentId: doc.id,
            documentTitle: doc.title,
            originalFilename: doc.originalFilename || undefined,
            chunkId: 0,
            sectionRef: 'Full Document',
            url: doc.url || undefined,
            score: 1.0,
            text: fullText.substring(0, 500),
            regulator: doc.regulator,
          });
        }
        context = contextParts.join('\n\n---\n\n');
      } else {
        // Standard retrieval for regular queries
        const retrieved = await retrieveContext(query, {
          jurisdiction,
          regulator,
          userId: scopeUserId,
          docIds,
          userIds,
        }, 10);
        context = retrieved.context;
        sources = retrieved.sources;
      }

      if (sources.length === 0) {
        const filters = [];
        if (jurisdiction) filters.push(`jurisdiction: ${jurisdiction}`);
        if (regulator) filters.push(`regulator: ${regulator}`);
        const filterText = filters.length > 0 ? ` matching ${filters.join(', ')}` : '';
        
        return res.json({
          answer: `Your uploaded documents do not contain any data related to "${query}"${filterText}. Please upload relevant regulatory documents or try a different query.`,
          sources: [],
          obligations: [],
        });
      }

      const systemPrompt = `You are a RegTech analyst specializing in global FIU/AML regulations. Answer questions ONLY from the provided CONTEXT.

Rules:
- Cite at least one source paragraph for every claim
- If evidence is weak, say "The available documents do not contain sufficient information on this topic" and cite what limited sources are available
- Never invent information
- Be precise and cite document titles and section references
- Use plain text format without markdown, bold, or special formatting characters
- Use simple dashes instead of em-dashes or en-dashes

Return your answer in plain text format followed by a Sources section with citations.`;

      const userPrompt = `CONTEXT:\n${context}\n\nQUESTION: ${query}\n\nProvide a concise answer with citations.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      });

      const rawAnswer = response.choices[0].message.content || '';
      const cleanAnswer = sanitizeLLMResponse(rawAnswer);

      const formattedSources = sources.map(source => ({
        title: source.documentTitle,
        originalFilename: source.originalFilename,
        regulator: source.regulator,
        text: source.text,
        sectionRef: source.sectionRef,
        url: source.url,
      }));

      res.json({
        answer: cleanAnswer,
        sources: formattedSources,
        context: context.substring(0, 500),
      });

    } catch (error) {
      console.error('Query error:', error);
      res.status(500).json({ 
        message: 'Query failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/extract-obligations', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.body;

      if (!documentId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }

      const document = await storage.getRegulatoryDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const obligations = await extractObligations(
        document.id,
        document.extractedText || '',
        document.jurisdiction,
        document.regulator
      );

      res.json({ obligations });

    } catch (error) {
      console.error('Obligation extraction error:', error);
      res.status(500).json({ 
        message: 'Extraction failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/obligations/analyze', isAuthenticated, aiRateLimit, async (req: any, res) => {
    try {
      const { documentIds } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ message: 'At least one document ID is required' });
      }

      const userId = req.session.userId;
      
      const documents = await Promise.all(
        documentIds.map((id: number) => storage.getRegulatoryDocument(id))
      );

      const validDocs = documents.filter(d => d !== null && d !== undefined);
      if (validDocs.length === 0) {
        return res.status(404).json({ message: 'No valid documents found' });
      }

      for (const doc of validDocs) {
        if (doc.uploadedBy !== userId) {
          return res.status(403).json({ message: 'You do not have access to one or more selected documents' });
        }
      }

      const jurisdictions = Array.from(new Set(validDocs.map(d => d.jurisdiction)));
      const regulators = Array.from(new Set(validDocs.map(d => d.regulator)));
      const combinedText = validDocs.map(d => {
        const text = d.extractedText || '';
        return `=== Document: ${d.originalFilename || d.title} ===\n${text.substring(0, 8000)}`;
      }).join('\n\n');

      const analysisPrompt = `You are a regulatory compliance expert analyzing documents for a Compliance Team at a financial institution. Analyze the following regulatory documents and extract all compliance obligations.

DOCUMENTS:
${combinedText}

JURISDICTIONS: ${jurisdictions.join(', ')}
REGULATORS: ${regulators.join(', ')}

Provide a comprehensive analysis in this exact JSON format:
{
  "jurisdiction": "Primary jurisdiction (e.g., UAE, UK, India)",
  "jurisdictionDetails": "Brief description of the regulatory landscape",
  "entityContext": "Types of entities these regulations apply to (e.g., Licensed Banks, NBFCs, VASPs)",
  "documentsSummary": "Brief summary of what these documents cover",
  "overallConfidence": 85,
  "insights": [
    {
      "id": "obl-1",
      "category": "KYC|AML|Sanctions|Reporting|RecordKeeping|Training|Governance|RiskAssessment",
      "requirement": "Clear statement of the obligation",
      "applicableTo": "Who this applies to (e.g., All licensed financial institutions)",
      "conditionalFraming": "If you are [entity type] with [condition], you must...",
      "roleActions": [
        {
          "role": "mlro",
          "roleLabel": "Money Laundering Reporting Officer",
          "actions": ["Specific action 1", "Specific action 2"],
          "priority": "high|medium|low"
        },
        {
          "role": "compliance_officer",
          "roleLabel": "Compliance Officer",
          "actions": ["Specific action 1"],
          "priority": "medium"
        }
      ],
      "deadline": "Specific deadline if mentioned, or null",
      "formatRequired": "Any specific format required for compliance (e.g., STR form, CTR report)",
      "penalty": "Penalties for non-compliance if stated",
      "transparency": {
        "explainable": "Plain-language explanation suitable for C-level executives or regulators",
        "traceable": {
          "documentRef": "Name of the source document",
          "section": "Section/Article reference (e.g., Article 15, Section 3.2)",
          "deductionPath": "How this obligation was derived from the text"
        },
        "verifiable": {
          "confidence": 90,
          "factors": ["Factor 1 supporting confidence", "Factor 2"]
        }
      }
    }
  ],
  "regulatoryUpdates": [
    {
      "title": "Recent regulatory update title",
      "source": "Source name (e.g., FIU-IND, FinCEN)",
      "date": "Approximate date",
      "summary": "What changed or was announced",
      "relevance": "Why this is relevant to the analyzed documents",
      "url": "URL if available"
    }
  ]
}

IMPORTANT GUIDELINES:
1. Generate realistic, actionable obligations based on the document content
2. Include role-based actions for: mlro, compliance_officer, cco (Chief Compliance Officer), aml_ops, compliance_analyst
3. Use conditional framing like "If you are an institutional investment bank with trading volumes above X..."
4. Reference specific sections from the documents in the traceable field
5. Set confidence percentages based on how clearly the obligation is stated
6. Leave regulatoryUpdates as an empty array - we will fetch real updates separately
7. All dates should be in readable format (e.g., "31 March 2025" or "Within 30 days of detection")`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 8000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return res.status(500).json({ message: 'No response from AI' });
      }

      const result = JSON.parse(content);
      result.generatedAt = new Date().toISOString();
      
      // Now fetch real regulatory updates using OpenAI web search
      try {
        const searchQuery = `Latest ${jurisdictions.join(' ')} AML anti-money laundering CFT regulatory updates news ${regulators.join(' ')} 2024 2025`;
        
        const webSearchResponse = await openai.responses.create({
          model: "gpt-4.1",
          tools: [{ type: "web_search_preview" }],
          input: `Search for the latest regulatory updates, news, and announcements related to AML/CFT (Anti-Money Laundering / Counter-Financing of Terrorism) regulations for ${jurisdictions.join(', ')}. 
          
Focus on:
- Recent regulatory guidance or circulars from ${regulators.join(', ')}
- New AML/CFT requirements or amendments
- Enforcement actions or penalties
- Upcoming compliance deadlines

For each update found, provide:
1. The title of the update
2. The source (regulatory body or news outlet)
3. The date (approximate if exact date unavailable)
4. A brief summary of what changed or was announced
5. Why this is relevant to financial institutions

Return the information in a structured format with real source URLs.`
        });

        // Extract regulatory updates with real URLs from the web search response
        const regulatoryUpdates: Array<{
          title: string;
          source: string;
          date: string;
          summary: string;
          relevance: string;
          url?: string;
        }> = [];

        // Parse the web search response - prioritize URL citations for reliability
        if (webSearchResponse.output) {
          // First, collect all URL citations
          const allCitations: Array<{ url: string; title: string; text?: string }> = [];
          let fullText = '';
          
          for (const item of webSearchResponse.output) {
            if (item.type === 'message' && item.content) {
              for (const contentItem of item.content) {
                if (contentItem.type === 'output_text') {
                  fullText += (contentItem.text || '') + '\n';
                  const annotations = contentItem.annotations || [];
                  
                  for (const ann of annotations) {
                    if (ann.type === 'url_citation' && ann.url) {
                      // Extract the text that this citation references
                      const text = contentItem.text || '';
                      const citedText = ann.start_index !== undefined && ann.end_index !== undefined
                        ? text.substring(ann.start_index, ann.end_index)
                        : '';
                      
                      // Avoid duplicates
                      if (!allCitations.find(c => c.url === ann.url)) {
                        allCitations.push({
                          url: ann.url,
                          title: ann.title || '',
                          text: citedText
                        });
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Build updates from citations (guaranteed to have real URLs)
          for (const citation of allCitations.slice(0, 8)) {
            try {
              const hostname = new URL(citation.url).hostname.replace('www.', '');
              
              // Try to extract a meaningful title
              let title = citation.title || '';
              if (!title && citation.text) {
                title = citation.text.replace(/\[.*?\]/g, '').trim().substring(0, 150);
              }
              if (!title) {
                title = `Regulatory Update from ${hostname}`;
              }
              
              // Try to identify the source from the hostname
              let source = hostname;
              if (hostname.includes('austrac')) source = 'AUSTRAC';
              else if (hostname.includes('fatf')) source = 'FATF';
              else if (hostname.includes('fincen')) source = 'FinCEN';
              else if (hostname.includes('fca.org')) source = 'FCA';
              else if (hostname.includes('gov.au')) source = 'Australian Government';
              else if (hostname.includes('reuters')) source = 'Reuters';
              else if (hostname.includes('lexology')) source = 'Lexology';
              else if (hostname.includes('regulationtomorrow')) source = 'Regulation Tomorrow';
              else source = hostname.charAt(0).toUpperCase() + hostname.slice(1).split('.')[0];
              
              regulatoryUpdates.push({
                title: title.substring(0, 200),
                source,
                date: 'Recent',
                summary: citation.text ? citation.text.substring(0, 400) : `Latest regulatory information from ${source}`,
                relevance: `Relevant to ${jurisdictions.join('/')} AML/CFT compliance`,
                url: citation.url
              });
            } catch (urlError) {
              console.warn('Failed to parse citation URL:', citation.url);
            }
          }
          
          // Fallback: if no citations found, try to extract URLs from the full text using regex
          if (regulatoryUpdates.length === 0 && fullText) {
            const urlRegex = /https?:\/\/[^\s\)\]"'<>]+/g;
            const extractedUrls = fullText.match(urlRegex) || [];
            const uniqueUrls = [...new Set(extractedUrls)].slice(0, 5);
            
            for (const url of uniqueUrls) {
              try {
                const hostname = new URL(url).hostname.replace('www.', '');
                let source = hostname;
                if (hostname.includes('austrac')) source = 'AUSTRAC';
                else if (hostname.includes('fatf')) source = 'FATF';
                else if (hostname.includes('fincen')) source = 'FinCEN';
                else if (hostname.includes('fca.org')) source = 'FCA';
                else if (hostname.includes('gov.au')) source = 'Australian Government';
                else source = hostname.charAt(0).toUpperCase() + hostname.slice(1).split('.')[0];
                
                regulatoryUpdates.push({
                  title: `Regulatory Information from ${source}`,
                  source,
                  date: 'Recent',
                  summary: `Latest AML/CFT regulatory information from ${source}`,
                  relevance: `Relevant to ${jurisdictions.join('/')} compliance requirements`,
                  url
                });
              } catch {
                // Skip invalid URLs
              }
            }
          }
        }
        
        result.regulatoryUpdates = regulatoryUpdates.slice(0, 8);
      } catch (webSearchError) {
        console.error('Web search error (continuing without updates):', webSearchError);
        result.regulatoryUpdates = [];
      }

      res.json(result);

    } catch (error) {
      console.error('Obligation analysis error:', error);
      res.status(500).json({ 
        message: 'Analysis failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/diff', isAuthenticated, aiRateLimit, async (req: any, res) => {
    try {
      const diffSchema = z.object({
        docIdOld: z.number({ required_error: 'Old document ID is required' }),
        docIdNew: z.number({ required_error: 'New document ID is required' }),
      });
      const validation = diffSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }
      const { docIdOld, docIdNew } = validation.data;

      const [oldDoc, newDoc] = await Promise.all([
        storage.getRegulatoryDocument(docIdOld),
        storage.getRegulatoryDocument(docIdNew),
      ]);

      if (!oldDoc || !newDoc) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Use more text for comprehensive comparison (up to 25000 chars each)
      const oldText = oldDoc.extractedText?.substring(0, 25000) || 'No text available';
      const newText = newDoc.extractedText?.substring(0, 25000) || 'No text available';
      
      const diffPrompt = `Compare these two regulatory document versions and identify changes with detailed analysis:

OLD VERSION (${oldDoc.title}):
${oldText}

NEW VERSION (${newDoc.title}):
${newText}

Return a JSON object with this structure:
{
  "summary": "Brief 2-3 sentence overview of the main changes",
  "sectionsAdded": [
    {"section": "Section 1.2: New KYC Requirements", "page": 5, "description": "Brief description of what this section adds and its regulatory impact"},
    ...
  ],
  "sectionsRemoved": [
    {"section": "Section 2.1: Simplified Identification", "page": 8, "description": "Brief description of what was removed and potential compliance implications"},
    ...
  ],
  "sectionsAmended": [
    {"section": "Section 4.3: Risk Assessment", "page": 15, "description": "Description of what changed in this section", "oldText": "Key excerpt from old version (1-2 sentences)", "newText": "Key excerpt from new version showing the change (1-2 sentences)"},
    ...
  ],
  "keyChanges": [
    "Most significant change #1 with specific detail",
    "Most significant change #2 with specific detail",
    "Most significant change #3 with specific detail"
  ],
  "complianceImpact": "Brief assessment of what organizations need to do differently to comply",
  "impactScore": 7
}

Rules:
- Include page numbers when available
- Use specific section titles and numbers
- Provide detailed descriptions for each change, not just titles
- For amended sections, include brief before/after excerpts when possible
- The keyChanges should be the 2-5 most important changes a compliance officer needs to know
- complianceImpact should be actionable guidance
- The impactScore should be 1-10 based on regulatory impact (1=minor clarifications, 10=major new requirements)`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are a regulatory document comparison expert. Return only valid JSON, no additional text."
          },
          { role: "user", content: diffPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const rawResponse = response.choices[0].message.content || '{}';
      const parsedDiff = JSON.parse(rawResponse);

      const diffSummary = sanitizeLLMResponse(parsedDiff.summary || 'No significant changes detected.');
      
      // Normalize section arrays - handle both old format (strings) and new format (objects)
      const normalizeSection = (item: any) => {
        if (typeof item === 'string') {
          return { section: item, description: '' };
        }
        return item;
      };
      
      const sectionsAdded = (parsedDiff.sectionsAdded || []).map(normalizeSection);
      const sectionsRemoved = (parsedDiff.sectionsRemoved || []).map(normalizeSection);
      const sectionsAmended = (parsedDiff.sectionsAmended || []).map(normalizeSection);

      const changeset = await storage.createChangeset({
        docIdNew: newDoc.id,
        docIdOld: oldDoc.id,
        diffSummary,
        sectionsAdded,
        sectionsRemoved,
        sectionsAmended,
        obligationChanges: [],
        impactScore: parsedDiff.impactScore || null,
      });

      await generateAlertsForChangeset(changeset, newDoc, oldDoc);

      res.json({
        changeset: {
          ...changeset,
          keyChanges: parsedDiff.keyChanges || [],
          complianceImpact: parsedDiff.complianceImpact || null,
        },
        diffSummary,
        keyChanges: parsedDiff.keyChanges || [],
        complianceImpact: parsedDiff.complianceImpact || null,
        oldDocument: { id: oldDoc.id, title: oldDoc.title },
        newDocument: { id: newDoc.id, title: newDoc.title },
      });

    } catch (error) {
      console.error('Diff error:', error);
      res.status(500).json({ 
        message: 'Diff failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { jurisdiction, regulator, status, limit } = req.query;
      const userId = req.session.userId;

      const documents = await storage.getRegulatoryDocuments({
        jurisdiction: jurisdiction && jurisdiction !== 'all' ? jurisdiction as string : undefined,
        regulator: regulator && regulator !== 'all' ? regulator as string : undefined,
        status: status && status !== 'all' ? status as string : undefined,
        limit: limit ? parseInt(limit as string) : 50,
        uploadedBy: userId,
      });

      res.json({ documents });

    } catch (error) {
      console.error('Documents fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch documents',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/documents-with-obligations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const documentsWithObligations = await db
        .select({
          id: regulatoryDocuments.id,
          title: regulatoryDocuments.title,
          jurisdiction: regulatoryDocuments.jurisdiction,
          regulator: regulatoryDocuments.regulator,
          status: regulatoryDocuments.status,
          obligationCount: count(obligations.id),
        })
        .from(regulatoryDocuments)
        .leftJoin(obligations, eq(obligations.docId, regulatoryDocuments.id))
        .where(
          and(
            eq(regulatoryDocuments.uploadedBy, userId),
            eq(regulatoryDocuments.status, 'active')
          )
        )
        .groupBy(regulatoryDocuments.id)
        .orderBy(regulatoryDocuments.id);
      
      res.json(documentsWithObligations);
    } catch (error) {
      console.error('Documents with obligations fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch documents with obligations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/documents/:docId/obligations', isAuthenticated, async (req: any, res) => {
    try {
      const docId = parseInt(req.params.docId);
      const { limit: limitParam = '100', offset: offsetParam = '0', area, actor } = req.query;
      const limitVal = parseInt(limitParam as string, 10);
      const offsetVal = parseInt(offsetParam as string, 10);
      
      const doc = await storage.getRegulatoryDocument(docId);
      if (!doc) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const conditions = [eq(obligations.docId, docId)];
      if (area && area !== 'all') {
        conditions.push(eq(obligations.area, area as string));
      }
      if (actor && actor !== 'all') {
        conditions.push(eq(obligations.actor, actor as string));
      }
      
      const [countResult] = await db.select({ total: count() })
        .from(obligations)
        .where(and(...conditions));
      
      const items = await db.select().from(obligations)
        .where(and(...conditions))
        .limit(limitVal)
        .offset(offsetVal);
      
      res.json({ 
        items, 
        total: countResult.total,
        document: {
          id: doc.id,
          title: doc.title,
          jurisdiction: doc.jurisdiction,
          regulator: doc.regulator
        }
      });
    } catch (error) {
      console.error('Document obligations fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch obligations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/documents/:docId/audit', isAuthenticated, async (req: any, res) => {
    try {
      const docId = parseInt(req.params.docId);
      
      const doc = await storage.getRegulatoryDocument(docId);
      if (!doc) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.json([]);
    } catch (error) {
      console.error('Document audit fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch audit logs',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/document/:id', isAuthenticated, async (req: any, res) => {
    try {
      const document = await storage.getRegulatoryDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const [obligationsResult, chunks] = await Promise.all([
        storage.getDocumentObligations(document.id),
        storage.getDocumentChunks(document.id),
      ]);

      res.json({
        document,
        obligations: obligationsResult,
        chunkCount: chunks.length,
      });

    } catch (error) {
      console.error('Document fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch('/api/regtech/document/:id', isAuthenticated, async (req: any, res) => {
    try {
      const docId = parseInt(req.params.id);
      const document = await storage.getRegulatoryDocument(docId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const { originalFilename, title, summary } = req.body;
      const updates: any = {};
      
      if (originalFilename !== undefined) {
        if (typeof originalFilename !== 'string') {
          return res.status(400).json({ message: 'originalFilename must be a string' });
        }
        updates.originalFilename = originalFilename.trim();
      }
      if (title !== undefined) {
        if (typeof title !== 'string') {
          return res.status(400).json({ message: 'title must be a string' });
        }
        updates.title = title.trim();
      }
      if (summary !== undefined) {
        if (typeof summary !== 'string') {
          return res.status(400).json({ message: 'summary must be a string' });
        }
        if (summary.length > 2000) {
          return res.status(400).json({ message: 'summary must be 2000 characters or less' });
        }
        // Update the summary within the metadata JSON using already-loaded document
        const currentMetadata = document.metadata || {};
        updates.metadata = {
          ...currentMetadata,
          summary: summary.trim()
        };
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid updates provided' });
      }

      const updated = await storage.updateRegulatoryDocument(docId, updates);
      res.json(updated);

    } catch (error) {
      console.error('Document update error:', error);
      res.status(500).json({ 
        message: 'Failed to update document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete('/api/regtech/document/:id', isAuthenticated, async (req: any, res) => {
    try {
      const document = await storage.getRegulatoryDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      await storage.deleteRegulatoryDocument(parseInt(req.params.id));

      res.json({ message: 'Document deleted successfully' });

    } catch (error) {
      console.error('Document delete error:', error);
      res.status(500).json({ 
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/document/:id/report-classification', isAuthenticated, async (req: any, res) => {
    try {
      const docId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { suggestedClassification, reason } = req.body;

      const reportSchema = z.object({
        suggestedClassification: z.enum(['regulatory', 'legal', 'guidance', 'policy', 'other']),
        reason: z.string().optional(),
      });

      const validation = reportSchema.safeParse({ suggestedClassification, reason });
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }

      const document = await storage.getRegulatoryDocument(docId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const { classificationDisagreements } = await import('@shared/schema');
      const [disagreement] = await db.insert(classificationDisagreements).values({
        docId,
        userId,
        originalClassification: document.classification || 'unknown',
        suggestedClassification,
        reason: reason || null,
        status: 'pending',
      }).returning();

      res.json({ 
        message: 'Classification feedback submitted',
        disagreement,
      });

    } catch (error) {
      console.error('Report classification error:', error);
      res.status(500).json({ 
        message: 'Failed to submit classification feedback',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/document/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const document = await storage.getRegulatoryDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (!(document as any).filePath) {
        return res.status(404).json({ message: 'Document file not found' });
      }

      res.download((document as any).filePath, (document as any).filename || 'document');

    } catch (error) {
      console.error('Document download error:', error);
      res.status(500).json({ 
        message: 'Failed to download document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.query;
      
      const alerts = await storage.getUserAlerts(
        req.session.userId,
        status as string | undefined
      );

      res.json({ alerts });

    } catch (error) {
      console.error('Alerts fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch alerts',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch('/api/regtech/alert/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const alert = await storage.markAlertAsRead(parseInt(req.params.id));
      res.json({ alert });

    } catch (error) {
      console.error('Alert update error:', error);
      res.status(500).json({ 
        message: 'Failed to update alert',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Alert Configuration CRUD endpoints
  app.get('/api/regtech/alert-configurations', isAuthenticated, async (req: any, res) => {
    try {
      const configurations = await storage.getUserAlertConfigurations(req.session.userId);
      res.json({ configurations });
    } catch (error) {
      console.error('Alert configurations fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch alert configurations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/alert-configurations', isAuthenticated, async (req: any, res) => {
    try {
      const { name, alertType, keywords, phrases, urls, regulators, jurisdictions, frequency, isActive } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Configuration name is required' });
      }

      const configuration = await storage.createAlertConfiguration({
        userId: req.session.userId,
        name,
        alertType: alertType || 'keyword',
        keywords: keywords || [],
        phrases: phrases || [],
        urls: urls || [],
        regulators: regulators || [],
        jurisdictions: jurisdictions || [],
        frequency: frequency || 'immediate',
        isActive: isActive !== false,
      });

      res.json({ configuration });
    } catch (error) {
      console.error('Alert configuration create error:', error);
      res.status(500).json({ 
        message: 'Failed to create alert configuration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch('/api/regtech/alert-configurations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, alertType, keywords, phrases, urls, regulators, jurisdictions, frequency, isActive } = req.body;

      const configuration = await storage.updateAlertConfiguration(id, req.session.userId, {
        name,
        alertType,
        keywords,
        phrases,
        urls,
        regulators,
        jurisdictions,
        frequency,
        isActive,
      });

      if (!configuration) {
        return res.status(404).json({ message: 'Configuration not found' });
      }

      res.json({ configuration });
    } catch (error) {
      console.error('Alert configuration update error:', error);
      res.status(500).json({ 
        message: 'Failed to update alert configuration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete('/api/regtech/alert-configurations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAlertConfiguration(id, req.session.userId);
      res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
      console.error('Alert configuration delete error:', error);
      res.status(500).json({ 
        message: 'Failed to delete alert configuration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/regtech/profile', isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getUserProfile(req.session.userId);
      res.json({ profile });

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch profile',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/profile', isAuthenticated, async (req: any, res) => {
    try {
      const { jurisdictions, topics, regulators, actorType, alertFrequency, emailNotifications } = req.body;

      const profile = await storage.upsertUserProfile({
        userId: req.session.userId,
        jurisdictions,
        topics,
        regulators,
        actorType,
        alertFrequency,
        emailNotifications,
      });

      res.json({ profile });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ 
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/regtech/analyze-url', isAuthenticated, aiRateLimit, async (req: any, res) => {
    try {
      const { url } = req.body;
      console.log('Analyzing URL:', url);

      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      let response;
      try {
        console.log('Fetching URL...');
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: AbortSignal.timeout(15000),
        });
        console.log('Fetch response status:', response.status);
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
          return res.status(400).json({ message: 'Request timed out. The website may be slow or blocking automated requests.' });
        }
        return res.status(400).json({ message: 'Unable to connect to the website. Please check the URL and try again.' });
      }
      
      if (!response.ok) {
        console.log('Non-OK response:', response.status, response.statusText);
        if (response.status === 403) {
          return res.status(400).json({ message: 'This website blocks automated access. Try downloading the page content as a file and uploading it to the Document Library instead.' });
        }
        if (response.status === 404) {
          return res.status(400).json({ message: 'Page not found. The URL may have changed or the content has been removed.' });
        }
        return res.status(400).json({ message: `Unable to access the page (status ${response.status}). Please verify the URL is correct.` });
      }

      const contentType = response.headers.get('content-type') || '';
      const isPdfUrl = url.toLowerCase().endsWith('.pdf');
      const isPdfContentType = contentType.includes('application/pdf');
      
      if (isPdfUrl || isPdfContentType) {
        console.log('PDF detected - URL ends with .pdf or Content-Type is application/pdf');
        return res.json({
          isPdf: true,
          title: 'PDF Document Detected',
          summary: 'This URL points to a PDF document. The Console cannot directly analyze PDF files from URLs because PDFs require specialized processing to extract their text content.',
          keyPoints: [
            '1. Click the "Download PDF" button to save the document to your computer.',
            '2. Go to the Library section in the navigation menu.',
            '3. Upload the PDF file using the upload area.',
            '4. Our document processing will use OCR technology to extract and analyze the text content.',
          ].join('\n'),
          impact: 'Once uploaded to the Library, the document will be fully searchable and available for AI-powered analysis through the Query AI feature.',
          isRelevant: true,
          url,
        });
      }

      const html = await response.text();
      
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      
      $('script, style, nav, header, footer, aside, iframe').remove();
      
      const title = $('title').text() || $('h1').first().text() || 'Untitled';
      const textContent = $('body').text().trim().replace(/\s+/g, ' ').substring(0, 8000);
      
      if (!textContent || textContent.length < 50) {
        const isJsRendered = html.includes('__NEXT_DATA__') || 
                             html.includes('react-root') || 
                             html.includes('ng-app') ||
                             html.includes('data-reactroot') ||
                             html.includes('nuxt') ||
                             (html.includes('<script') && (html.match(/<script/g)?.length || 0) > 5);
        
        if (isJsRendered || url.includes('.go.jp') || url.includes('gov.') || url.includes('.gov')) {
          return res.status(400).json({ 
            message: 'This website uses dynamic content that cannot be analyzed directly. Please save the page as a PDF or copy the text content and upload it to the Document Library instead.',
            hint: 'government_site'
          });
        }
        return res.status(400).json({ message: 'No meaningful content found on the page. The site may require JavaScript to display content.' });
      }

      const analysisPrompt = `Analyze this webpage content and extract key information:

URL: ${url}
Title: ${title}

Content:
${textContent}

First, determine if this content is relevant to RegTech, BFSI Compliance, or regulatory matters (AML, KYC, sanctions, financial crime, banking regulations, etc.).

Provide analysis in the following format:

Relevance: YES or NO (is this content related to RegTech, BFSI compliance, or regulatory matters?)

Summary: 2-3 sentences about the main topic and purpose.

Key Points: List the 3-5 most important points. Use numbered format (1. 2. 3.) not hyphens or bullet points.

Regulatory Impact: 1-2 sentences about who is affected and what they need to do, or "Not applicable" if not compliance-related.

Use plain language without markdown formatting, hyphens, or special characters.`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a RegTech analyst specializing in global FIU/AML regulations. Provide concise, professional analysis without special formatting. Be honest about whether content is relevant to regulatory compliance."
          },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const rawAnalysis = aiResponse.choices[0].message.content || '';
      const cleanAnalysis = sanitizeLLMResponse(rawAnalysis);
      
      const relevanceMatch = cleanAnalysis.match(/Relevance[:\s]*(YES|NO)/i);
      const isRelevant = !relevanceMatch || relevanceMatch[1].toUpperCase() !== 'NO';
      
      const summaryMatch = cleanAnalysis.match(/Summary[:\s]*(.+?)(?=Key Points|Regulatory Impact|$)/is);
      const keyPointsMatch = cleanAnalysis.match(/Key Points[:\s]*(.+?)(?=Regulatory Impact|$)/is);
      const impactMatch = cleanAnalysis.match(/Regulatory Impact[:\s]*(.+?)$/is);
      
      const summary = summaryMatch ? summaryMatch[1].trim() : cleanAnalysis.substring(0, 300);
      const keyPointsText = keyPointsMatch ? keyPointsMatch[1].trim() : '';
      const keyPoints = keyPointsText.split(/\n/).filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim()).filter(Boolean);
      const regulatoryImpact = impactMatch ? impactMatch[1].trim() : '';

      res.json({
        url,
        title,
        summary,
        keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
        regulatoryImpact: regulatoryImpact || undefined,
        isRelevant,
        relevanceWarning: !isRelevant ? "This content does not appear to be related to regulatory compliance, financial services, or BFSI. The analysis is provided for reference only." : undefined,
      });

    } catch (error) {
      console.error('URL analysis error:', error);
      res.status(500).json({ 
        message: 'URL analysis failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================================================
  // Word Document Generation
  // ============================================================================

  const docxSectionSchema = z.object({
    type: z.enum(['heading', 'subheading', 'paragraph', 'list', 'divider', 'metadata']),
    text: z.string().optional(),
    items: z.array(z.string()).optional(),
    color: z.enum(['green', 'red', 'yellow', 'default']).optional(),
  });

  const docxRequestSchema = z.object({
    content: z.array(docxSectionSchema).min(1, 'Content must have at least one section'),
    title: z.string().optional(),
    generatedAt: z.string().optional(),
  });

  app.post('/api/regtech/generate-docx', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = docxRequestSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Invalid request body',
          errors: validatedData.error.flatten().fieldErrors 
        });
      }
      
      const { content, title, generatedAt } = validatedData.data;

      const docx = await import('docx');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = docx;

      const children: any[] = [];
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'RegIntel',
              bold: true,
              size: 28,
              color: '334155',
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${generatedAt}`,
              size: 18,
              color: '64748B',
              italics: true,
            }),
          ],
          spacing: { after: 300 },
        })
      );

      for (const section of content) {
        switch (section.type) {
          case 'heading':
            children.push(
              new Paragraph({
                text: section.text || '',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 },
              })
            );
            break;
            
          case 'subheading':
            children.push(
              new Paragraph({
                text: section.text || '',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );
            break;
            
          case 'paragraph':
            let color = '000000';
            if (section.color === 'green') color = '16A34A';
            else if (section.color === 'red') color = 'DC2626';
            else if (section.color === 'yellow') color = 'CA8A04';
            
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.text || '',
                    size: 22,
                    color,
                  }),
                ],
                spacing: { after: 150 },
              })
            );
            break;
            
          case 'list':
            if (section.items && Array.isArray(section.items)) {
              for (const item of section.items) {
                let itemColor = '000000';
                if (section.color === 'green') itemColor = '16A34A';
                else if (section.color === 'red') itemColor = 'DC2626';
                else if (section.color === 'yellow') itemColor = 'CA8A04';
                
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${item}`,
                        size: 22,
                        color: itemColor,
                      }),
                    ],
                    spacing: { after: 80 },
                    indent: { left: 360 },
                  })
                );
              }
            }
            break;
            
          case 'metadata':
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.text || '',
                    size: 18,
                    color: '64748B',
                    italics: true,
                  }),
                ],
                spacing: { after: 100 },
              })
            );
            break;
            
          case 'divider':
            children.push(
              new Paragraph({
                text: '',
                border: {
                  bottom: {
                    color: 'E2E8F0',
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
                spacing: { before: 200, after: 200 },
              })
            );
            break;
        }
      }

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Roboto Light',
                size: 22,
              },
            },
          },
        },
        sections: [{
          properties: {},
          children,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.docx"`);
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error('DOCX generation error:', error);
      res.status(500).json({ 
        message: 'Failed to generate Word document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================================================
  // Session Management Routes
  // ============================================================================

  // Get active session for current user
  app.get('/api/regtech/sessions/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const result = await db.query.regtechSessions.findFirst({
        where: (sessions, { and, eq }) => and(
          eq(sessions.userId, userId),
          eq(sessions.status, 'active')
        ),
        with: { activities: true },
        orderBy: (sessions, { desc }) => [desc(sessions.startedAt)],
      });
      res.json({ session: result || null });
    } catch (error) {
      console.error('Get active session error:', error);
      res.status(500).json({ message: 'Failed to get active session' });
    }
  });

  // Get all sessions for current user
  app.get('/api/regtech/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const sessions = await db.query.regtechSessions.findMany({
        where: (sessions, { eq }) => eq(sessions.userId, userId),
        with: { activities: true },
        orderBy: (sessions, { desc }) => [desc(sessions.startedAt)],
      });
      res.json({ sessions });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ message: 'Failed to get sessions' });
    }
  });

  // Start a new session
  app.post('/api/regtech/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Session name is required' });
      }

      // Ensure regtechUsers entry exists for this user (auto-sync from users table)
      const existingRegtechUser = await db.query.regtechUsers.findFirst({
        where: (ru, { eq }) => eq(ru.id, userId),
      });
      
      if (!existingRegtechUser) {
        // Sync user from users table to regtechUsers
        const mainUser = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
        });
        if (mainUser && mainUser.email && mainUser.password) {
          await db.insert(regtechUsers).values({
            id: userId,
            email: mainUser.email,
            password: mainUser.password,
            firstName: mainUser.firstName || null,
            lastName: mainUser.lastName || null,
            role: mainUser.role || 'compliance_analyst',
            isAdmin: mainUser.isAdmin || false,
            isActive: true,
          }).onConflictDoNothing();
        }
      }

      // End any existing active sessions for this user
      const { regtechSessions } = await import('@shared/schema');
      await db.update(regtechSessions)
        .set({ status: 'ended', endedAt: new Date() })
        .where(and(eq(regtechSessions.userId, userId), eq(regtechSessions.status, 'active')));

      const [session] = await db.insert(regtechSessions).values({
        id: nanoid(),
        userId,
        name: name.trim(),
        status: 'active',
        startedAt: new Date(),
      }).returning();

      res.json({ session });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ message: 'Failed to create session' });
    }
  });

  // End a session
  app.post('/api/regtech/sessions/:id/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      
      const { regtechSessions } = await import('@shared/schema');
      const [session] = await db.update(regtechSessions)
        .set({ status: 'ended', endedAt: new Date() })
        .where(and(eq(regtechSessions.id, id), eq(regtechSessions.userId, userId)))
        .returning();

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json({ session });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({ message: 'Failed to end session' });
    }
  });

  // Delete a session and its activities
  app.delete('/api/regtech/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      
      const { regtechSessions, regtechSessionActivities } = await import('@shared/schema');
      
      // First verify the session belongs to this user
      const session = await db.query.regtechSessions.findFirst({
        where: (sessions, { and, eq: eqOp }) => and(
          eqOp(sessions.id, id),
          eqOp(sessions.userId, userId)
        ),
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Delete activities first (foreign key constraint)
      await db.delete(regtechSessionActivities).where(eq(regtechSessionActivities.sessionId, id));
      
      // Delete the session
      await db.delete(regtechSessions).where(eq(regtechSessions.id, id));

      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({ message: 'Failed to delete session' });
    }
  });

  // Add activity to current active session
  app.post('/api/regtech/sessions/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { activityType, data } = req.body;

      if (!activityType) {
        return res.status(400).json({ message: 'Activity type is required' });
      }

      // Get active session
      const activeSession = await db.query.regtechSessions.findFirst({
        where: (sessions, { and, eq }) => and(
          eq(sessions.userId, userId),
          eq(sessions.status, 'active')
        ),
      });

      if (!activeSession) {
        return res.status(404).json({ message: 'No active session found' });
      }

      const { regtechSessionActivities } = await import('@shared/schema');
      const [activity] = await db.insert(regtechSessionActivities).values({
        id: nanoid(),
        sessionId: activeSession.id,
        activityType,
        data,
      }).returning();

      res.json({ activity });
    } catch (error) {
      console.error('Add session activity error:', error);
      res.status(500).json({ message: 'Failed to add session activity' });
    }
  });

  // Get session with activities by ID
  app.get('/api/regtech/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;

      const session = await db.query.regtechSessions.findFirst({
        where: (sessions, { and, eq }) => and(
          eq(sessions.id, id),
          eq(sessions.userId, userId)
        ),
        with: { activities: true },
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json({ session });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({ message: 'Failed to get session' });
    }
  });

  // Archive a session and generate DOCX export
  app.post('/api/regtech/sessions/:id/archive', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;

      const session = await db.query.regtechSessions.findFirst({
        where: (sessions, { and, eq }) => and(
          eq(sessions.id, id),
          eq(sessions.userId, userId)
        ),
        with: { activities: true },
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = await import('docx');

      const formatTimestamp = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const children: any[] = [
        new Paragraph({
          text: 'FETCH PATTERNS',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: 'RegTech Edition - Session Archive',
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Session Name: ', bold: true }),
            new TextRun({ text: session.name }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Started: ', bold: true }),
            new TextRun({ text: formatTimestamp(session.startedAt) }),
          ],
        }),
      ];

      if (session.endedAt) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Ended: ', bold: true }),
              new TextRun({ text: formatTimestamp(session.endedAt) }),
            ],
          })
        );
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Total Activities: ', bold: true }),
            new TextRun({ text: String(session.activities?.length || 0) }),
          ],
          spacing: { after: 400 },
        })
      );

      if (session.activities && session.activities.length > 0) {
        children.push(
          new Paragraph({
            text: 'Session Activities',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          })
        );

        for (const activity of session.activities) {
          const activityData = typeof activity.data === 'string' 
            ? JSON.parse(activity.data) 
            : activity.data;

          // Color coding for activity types: query=blue, console=green, diff=orange
          const activityColor = 
            activity.activityType === 'query' ? '2563EB' : 
            (activity.activityType === 'console' || activity.activityType === 'console_analysis') ? '16A34A' : 
            (activity.activityType === 'diff' || activity.activityType === 'document_diff') ? 'EA580C' : '000000';
          
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${activity.activityType.toUpperCase()}`, bold: true, color: activityColor }),
                new TextRun({ text: ` - ${formatTimestamp(activity.createdAt)}` }),
              ],
              spacing: { before: 200 },
            })
          );

          if (activity.activityType === 'query' && activityData) {
            if (activityData.question) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Question: ', bold: true, italics: true }),
                    new TextRun({ text: activityData.question }),
                  ],
                })
              );
            }
            if (activityData.answer) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Answer:', bold: true, italics: true }),
                  ],
                  spacing: { after: 50 },
                })
              );
              
              // Parse and format the answer with lists and structure
              const answerLines = (activityData.answer as string).split('\n');
              for (const line of answerLines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;
                
                // Check for numbered list
                const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
                if (numberedMatch) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${numberedMatch[1]}. `, bold: true }),
                        new TextRun({ text: numberedMatch[2] }),
                      ],
                      indent: { left: 360 },
                    })
                  );
                  continue;
                }
                
                // Check for bullet list
                const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
                if (bulletMatch) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: '• ' }),
                        new TextRun({ text: bulletMatch[1] }),
                      ],
                      indent: { left: 360 },
                    })
                  );
                  continue;
                }
                
                // Check for heading-style text (ends with colon)
                if (trimmedLine.endsWith(':') && trimmedLine.length < 80) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: trimmedLine, bold: true }),
                      ],
                      spacing: { before: 100 },
                    })
                  );
                  continue;
                }
                
                // Regular paragraph
                children.push(new Paragraph({ text: trimmedLine }));
              }
            }
            
            // Add sources if available - with detailed page/section references
            if (activityData.sources && Array.isArray(activityData.sources) && activityData.sources.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Sources:', bold: true, italics: true }),
                  ],
                  spacing: { before: 100 },
                })
              );
              for (const source of activityData.sources) {
                // Build detailed source reference with page numbers and sections
                let sourceText = '';
                let excerptText = '';
                if (typeof source === 'string') {
                  sourceText = source;
                } else {
                  const title = source.originalFilename || source.title || source.document || 'Unknown Document';
                  const parts: string[] = [title];
                  
                  // Add section reference
                  if (source.sectionRef) {
                    parts.push(`Section: ${source.sectionRef}`);
                  } else if (source.section) {
                    parts.push(`Section: ${source.section}`);
                  }
                  
                  // Add page number if available
                  if (source.page) {
                    parts.push(`Page ${source.page}`);
                  }
                  
                  // Add regulator if available
                  if (source.regulator) {
                    parts.push(`(${source.regulator})`);
                  }
                  
                  sourceText = parts.join(' | ');
                  
                  // Include text excerpt if available
                  if (source.text) {
                    excerptText = source.text.substring(0, 200) + (source.text.length > 200 ? '...' : '');
                  }
                }
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({ text: `- ${sourceText}` }),
                    ],
                    indent: { left: 360 },
                  })
                );
                // Add excerpt as a sub-paragraph if available
                if (excerptText) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `"${excerptText}"`, italics: true, color: '666666', size: 20 }),
                      ],
                      indent: { left: 720 },
                      spacing: { after: 80 },
                    })
                  );
                }
              }
            }
          } else if ((activity.activityType === 'console' || activity.activityType === 'console_analysis') && activityData) {
            // Console URL Analysis - show comprehensive details with color coding
            if (activityData.url) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'URL: ', bold: true, color: '16A34A' }),
                    new TextRun({ text: activityData.url }),
                  ],
                })
              );
            }
            if (activityData.title) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Title: ', bold: true }),
                    new TextRun({ text: activityData.title }),
                  ],
                })
              );
            }
            if (activityData.summary) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Summary:', bold: true }),
                  ],
                  spacing: { before: 100 },
                }),
                new Paragraph({ text: activityData.summary, spacing: { after: 100 } })
              );
            }
            // Key Points
            if (activityData.keyPoints && Array.isArray(activityData.keyPoints) && activityData.keyPoints.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Key Points:', bold: true, color: '16A34A' }),
                  ],
                  spacing: { before: 100 },
                })
              );
              activityData.keyPoints.forEach((point: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({ text: '• ' }),
                      new TextRun({ text: point }),
                    ],
                    indent: { left: 360 },
                  })
                );
              });
            }
            // Impact Analysis
            if (activityData.impactAnalysis) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Compliance Impact:', bold: true, color: '2563EB' }),
                  ],
                  spacing: { before: 100 },
                }),
                new Paragraph({ text: activityData.impactAnalysis, spacing: { after: 100 } })
              );
            }
            // Regulatory Categories
            if (activityData.categories && Array.isArray(activityData.categories) && activityData.categories.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Categories: ', bold: true }),
                    new TextRun({ text: activityData.categories.join(', ') }),
                  ],
                })
              );
            }
          } else if ((activity.activityType === 'diff' || activity.activityType === 'document_diff') && activityData) {
            // Document Difference activity - show full details
            if (activityData.oldDocument || activityData.newDocument) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Old Version: ', bold: true }),
                    new TextRun({ text: activityData.oldDocument || 'Unknown' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'New Version: ', bold: true }),
                    new TextRun({ text: activityData.newDocument || 'Unknown' }),
                  ],
                  spacing: { after: 100 },
                })
              );
            }
            
            // Summary
            if (activityData.diffSummary) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Summary: ', bold: true }),
                  ],
                }),
                new Paragraph({
                  text: activityData.diffSummary,
                  spacing: { after: 100 },
                })
              );
            }
            
            // Sections Added
            const sectionsAdded = Array.isArray(activityData.sectionsAdded) ? activityData.sectionsAdded : [];
            if (sectionsAdded.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Sections Added:', bold: true, color: '16A34A' }),
                  ],
                })
              );
              sectionsAdded.forEach((section: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({ text: '• ' }),
                      new TextRun({ text: section }),
                    ],
                  })
                );
              });
            }
            
            // Sections Removed
            const sectionsRemoved = Array.isArray(activityData.sectionsRemoved) ? activityData.sectionsRemoved : [];
            if (sectionsRemoved.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Sections Removed:', bold: true, color: 'DC2626' }),
                  ],
                  spacing: { before: 100 },
                })
              );
              sectionsRemoved.forEach((section: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({ text: '• ' }),
                      new TextRun({ text: section }),
                    ],
                  })
                );
              });
            }
            
            // Sections Amended
            const sectionsAmended = Array.isArray(activityData.sectionsAmended) ? activityData.sectionsAmended : [];
            if (sectionsAmended.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Sections Amended:', bold: true, color: 'CA8A04' }),
                  ],
                  spacing: { before: 100 },
                })
              );
              sectionsAmended.forEach((section: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({ text: '• ' }),
                      new TextRun({ text: section }),
                    ],
                  })
                );
              });
            }
            
            // Impact Score
            if (activityData.impactScore !== undefined) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Impact Score: ', bold: true }),
                    new TextRun({ text: `${activityData.impactScore}/10` }),
                  ],
                  spacing: { before: 100 },
                })
              );
            }
          }

          children.push(
            new Paragraph({ text: '', spacing: { after: 100 } })
          );
        }
      }

      children.push(
        new Paragraph({
          text: `Generated by Fetch Patterns RegTech Edition on ${formatTimestamp(new Date())}`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
        })
      );

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Roboto Light',
                size: 22,
              },
            },
          },
        },
        sections: [{
          properties: {},
          children,
        }],
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="RegIntel_Session_${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx"`);
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error('Archive session error:', error);
      res.status(500).json({ message: 'Failed to archive session' });
    }
  });

  // ============================================================================
  // Regulatory Intelligence - Regulations & Legal Units (Phase 0)
  // ============================================================================

  // Ensure rule pack is in database
  ensureRulePackExists().catch(err => console.error('Failed to init rule pack:', err));

  // Helper to get user's organization ID - returns null if user is not a regtech user or has no org
  async function getUserOrganizationId(userId: string | number): Promise<string | null> {
    // Query from main users table where organizationId is maintained
    const user = await db.select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, String(userId)))
      .limit(1);
    return user[0]?.organizationId || null;
  }

  // Helper to require organization membership for regulation endpoints
  async function requireOrganization(userId: number, res: any): Promise<string | null> {
    const orgId = await getUserOrganizationId(userId);
    if (!orgId) {
      res.status(403).json({ message: 'Organization membership required to access regulations' });
      return null;
    }
    return orgId;
  }

  // Get all regulations (scoped to user's organization)
  app.get('/api/regtech/regulations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const regs = await db.select().from(regulations)
        .where(eq(regulations.organizationId, orgId))
        .orderBy(regulations.createdAt);
      res.json(regs);
    } catch (error) {
      console.error('Get regulations error:', error);
      res.status(500).json({ message: 'Failed to get regulations' });
    }
  });

  // Get single regulation (with org scoping)
  app.get('/api/regtech/regulations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }
      res.json(reg);
    } catch (error) {
      console.error('Get regulation error:', error);
      res.status(500).json({ message: 'Failed to get regulation' });
    }
  });

  // Create regulation from existing document (with ownership validation)
  app.post('/api/regtech/regulations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { docId, jurisdiction, regulator, language, title, effectiveDate, versionLabel } = req.body;
      
      if (!docId || !jurisdiction || !regulator || !title || !versionLabel) {
        return res.status(400).json({ message: 'Missing required fields: docId, jurisdiction, regulator, title, versionLabel' });
      }

      // Verify document ownership
      const doc = await storage.getDocument(docId) as any;
      if (!doc || doc.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Document not found or access denied' });
      }

      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const regulationId = await createRegulationFromDocument(docId, {
        jurisdiction,
        regulator,
        language: language || 'en',
        title,
        effectiveDate,
        versionLabel,
      }, orgId);

      res.json({ regulationId, message: 'Regulation created' });
    } catch (error) {
      console.error('Create regulation error:', error);
      res.status(500).json({ message: 'Failed to create regulation' });
    }
  });

  // Process regulation (OCR + segmentation) - with org scoping
  app.post('/api/regtech/regulations/:id/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      // Verify regulation belongs to user's org
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }
      
      const { force } = req.body;
      const result = await processRegulation(req.params.id, force === true);
      res.json(result);
    } catch (error) {
      console.error('Process regulation error:', error);
      res.status(500).json({ message: 'Failed to process regulation' });
    }
  });

  // Reprocess existing document through new pipeline (with ownership and org validation)
  app.post('/api/regtech/documents/:id/reprocess', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const docId = parseInt(req.params.id, 10);
      
      // Verify document ownership
      const doc = await storage.getDocument(docId) as any;
      if (!doc || doc.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Document not found or access denied' });
      }
      
      const result = await reprocessExistingDocument(docId);
      
      if (!result) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Reprocess document error:', error);
      res.status(500).json({ message: 'Failed to reprocess document' });
    }
  });

  // Get legal units for a regulation (with org scoping and proper pagination)
  app.get('/api/regtech/regulations/:id/legal-units', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { limit: limitParam = '50', offset: offsetParam = '0', unitType } = req.query;
      const limitVal = parseInt(limitParam as string, 10);
      const offsetVal = parseInt(offsetParam as string, 10);
      
      // Verify regulation belongs to user's org
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }
      
      // Build query conditions
      const conditions = [eq(legalUnits.regulationId, req.params.id)];
      if (unitType) {
        conditions.push(eq(legalUnits.unitType, unitType as string));
      }
      
      // Get total count
      const [countResult] = await db.select({ total: count() })
        .from(legalUnits)
        .where(and(...conditions));
      
      // Get paginated items
      const units = await db.select().from(legalUnits)
        .where(and(...conditions))
        .orderBy(legalUnits.ordinal)
        .limit(limitVal)
        .offset(offsetVal);
      
      res.json({ items: units, total: countResult.total });
    } catch (error) {
      console.error('Get legal units error:', error);
      res.status(500).json({ message: 'Failed to get legal units' });
    }
  });

  // Get single legal unit (with org scoping via regulation)
  app.get('/api/regtech/legal-units/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const [unit] = await db.select().from(legalUnits).where(eq(legalUnits.id, req.params.id)).limit(1);
      
      if (!unit) {
        return res.status(404).json({ message: 'Legal unit not found' });
      }
      
      // Verify regulation belongs to user's org
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, unit.regulationId),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Legal unit not found' });
      }
      
      res.json(unit);
    } catch (error) {
      console.error('Get legal unit error:', error);
      res.status(500).json({ message: 'Failed to get legal unit' });
    }
  });

  // Get obligations for a regulation (with org scoping and proper pagination)
  app.get('/api/regtech/regulations/:id/obligations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { limit: limitParam = '50', offset: offsetParam = '0', type, status } = req.query;
      const limitVal = parseInt(limitParam as string, 10);
      const offsetVal = parseInt(offsetParam as string, 10);
      
      // Verify regulation belongs to user's org
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }
      
      // Build query conditions
      const conditions = [eq(regulatoryObligations.regulationId, req.params.id)];
      if (type) {
        conditions.push(eq(regulatoryObligations.obligationType, type as string));
      }
      if (status) {
        conditions.push(eq(regulatoryObligations.reviewStatus, status as string));
      }
      
      // Get total count
      const [countResult] = await db.select({ total: count() })
        .from(regulatoryObligations)
        .where(and(...conditions));
      
      // Get paginated items
      const obligations = await db.select().from(regulatoryObligations)
        .where(and(...conditions))
        .orderBy(regulatoryObligations.createdAt)
        .limit(limitVal)
        .offset(offsetVal);
      
      res.json({ items: obligations, total: countResult.total });
    } catch (error) {
      console.error('Get obligations error:', error);
      res.status(500).json({ message: 'Failed to get obligations' });
    }
  });

  // Get single obligation (with org scoping via regulation)
  app.get('/api/regtech/obligations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const [obl] = await db.select().from(regulatoryObligations).where(eq(regulatoryObligations.id, req.params.id)).limit(1);
      
      if (!obl) {
        return res.status(404).json({ message: 'Obligation not found' });
      }
      
      // Verify regulation belongs to user's org
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, obl.regulationId),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Obligation not found' });
      }
      
      res.json(obl);
    } catch (error) {
      console.error('Get obligation error:', error);
      res.status(500).json({ message: 'Failed to get obligation' });
    }
  });

  // Review obligation (with org scoping)
  app.post('/api/regtech/obligations/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { status, reviewNotes } = req.body;
      
      if (!['approved', 'needs_edit', 'unreviewed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid review status' });
      }
      
      // Get obligation and verify org access
      const [obl] = await db.select().from(regulatoryObligations).where(eq(regulatoryObligations.id, req.params.id)).limit(1);
      
      if (!obl) {
        return res.status(404).json({ message: 'Obligation not found' });
      }
      
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, obl.regulationId),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Obligation not found' });
      }
      
      await db.update(regulatoryObligations)
        .set({
          reviewStatus: status,
          reviewNotes: reviewNotes || null,
          reviewedByUserId: userId,
          reviewedAt: new Date(),
        })
        .where(eq(regulatoryObligations.id, req.params.id));
      
      res.json({ message: 'Obligation reviewed' });
    } catch (error) {
      console.error('Review obligation error:', error);
      res.status(500).json({ message: 'Failed to review obligation' });
    }
  });

  // Dashboard stats endpoint
  app.get('/api/regtech/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;

      // Get regulations count by jurisdiction
      const regs = await db.select().from(regulations)
        .where(eq(regulations.organizationId, orgId));
      
      const byJurisdiction: Record<string, number> = {};
      regs.forEach(r => {
        byJurisdiction[r.jurisdiction] = (byJurisdiction[r.jurisdiction] || 0) + 1;
      });

      // Get obligations counts - properly org-scoped via regulation join
      const regIds = regs.map(r => r.id);
      let obligations: any[] = [];
      if (regIds.length > 0) {
        obligations = await db.select({
          id: regulatoryObligations.id,
          reviewStatus: regulatoryObligations.reviewStatus,
          modality: regulatoryObligations.modality,
          regulationId: regulatoryObligations.regulationId
        }).from(regulatoryObligations)
          .innerJoin(regulations, eq(regulatoryObligations.regulationId, regulations.id))
          .where(eq(regulations.organizationId, orgId));
      }

      const byStatus = {
        unreviewed: obligations.filter(o => o.reviewStatus === 'unreviewed').length,
        approved: obligations.filter(o => o.reviewStatus === 'approved').length,
        needs_edit: obligations.filter(o => o.reviewStatus === 'needs_edit').length
      };

      const byModality: Record<string, number> = {};
      obligations.forEach(o => {
        byModality[o.modality] = (byModality[o.modality] || 0) + 1;
      });

      // Get controls and evidence for org
      const controls = await db.select().from(complianceControls)
        .where(eq(complianceControls.organizationId, orgId));
      
      const evidence = await db.select().from(complianceEvidence)
        .where(eq(complianceEvidence.organizationId, orgId));

      // Get mappings - properly org-scoped via obligation->regulation->org chain
      let mappings: any[] = [];
      if (regIds.length > 0) {
        mappings = await db.select({
          id: obligationMappings.id,
          obligationId: obligationMappings.obligationId,
          controlId: obligationMappings.controlId,
          evidenceId: obligationMappings.evidenceId,
          humanVerified: obligationMappings.humanVerified
        }).from(obligationMappings)
          .innerJoin(regulatoryObligations, eq(obligationMappings.obligationId, regulatoryObligations.id))
          .innerJoin(regulations, eq(regulatoryObligations.regulationId, regulations.id))
          .where(eq(regulations.organizationId, orgId));
      }

      // Calculate coverage
      const mappedObligationIds = new Set(mappings.map(m => m.obligationId));
      const obligationsWithMappings = mappedObligationIds.size;
      const obligationsWithoutMappings = obligations.length - obligationsWithMappings;
      const coveragePercent = obligations.length > 0 
        ? Math.round((obligationsWithMappings / obligations.length) * 100) 
        : 0;

      res.json({
        regulations: {
          total: regs.length,
          byJurisdiction
        },
        obligations: {
          total: obligations.length,
          byStatus,
          byModality
        },
        mappings: {
          total: mappings.length,
          withControls: mappings.filter(m => m.controlId).length,
          withEvidence: mappings.filter(m => m.evidenceId).length,
          verified: mappings.filter(m => m.humanVerified).length
        },
        controls: {
          total: controls.length
        },
        evidence: {
          total: evidence.length
        },
        coverage: {
          obligationsWithMappings,
          obligationsWithoutMappings,
          coveragePercent
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to get dashboard stats' });
    }
  });

  // Get version history for a regulation
  app.get('/api/regtech/regulations/:id/versions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;

      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);

      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }

      const versions = await db.select().from(regulationVersions)
        .where(eq(regulationVersions.regulationId, req.params.id))
        .orderBy(regulationVersions.versionNumber);

      res.json(versions);
    } catch (error) {
      console.error('Get versions error:', error);
      res.status(500).json({ message: 'Failed to get version history' });
    }
  });

  // Create a new version for a regulation
  app.post('/api/regtech/regulations/:id/versions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;

      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);

      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }

      const { versionLabel, changeType, changeSummary, effectiveDate } = req.body;

      // Get current version count
      const existingVersions = await db.select().from(regulationVersions)
        .where(eq(regulationVersions.regulationId, req.params.id));

      const versionNumber = existingVersions.length + 1;
      const previousVersion = existingVersions.length > 0 
        ? existingVersions[existingVersions.length - 1] 
        : null;

      // Count current obligations
      const oblCount = await db.select({ count: count() }).from(regulatoryObligations)
        .where(eq(regulatoryObligations.regulationId, req.params.id));

      // Get current legal units for snapshot
      const currentUnits = await db.select({
        unitKey: legalUnits.unitKey,
        unitType: legalUnits.unitType,
        textHash: legalUnits.textHash
      }).from(legalUnits)
        .where(eq(legalUnits.regulationId, req.params.id));

      const versionId = `rv_${nanoid(12)}`;
      await db.insert(regulationVersions).values({
        id: versionId,
        regulationId: req.params.id,
        versionNumber,
        versionLabel: versionLabel || reg.versionLabel,
        previousVersionId: previousVersion?.id || null,
        changeType: changeType || 'update',
        changeSummary: changeSummary || null,
        effectiveDate: effectiveDate || reg.effectiveDate,
        sourceHash: reg.sourceHash,
        totalObligations: oblCount[0]?.count || 0,
        snapshotJson: currentUnits
      });

      // Update regulation version label
      await db.update(regulations)
        .set({ versionLabel: versionLabel || reg.versionLabel, updatedAt: new Date() })
        .where(eq(regulations.id, req.params.id));

      res.json({ message: 'Version created', versionId, versionNumber });
    } catch (error) {
      console.error('Create version error:', error);
      res.status(500).json({ message: 'Failed to create version' });
    }
  });

  // Compare two versions of a regulation
  app.get('/api/regtech/regulations/:id/versions/compare', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;

      const { v1, v2 } = req.query;
      if (!v1 || !v2) {
        return res.status(400).json({ message: 'Both v1 and v2 version IDs required' });
      }

      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);

      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }

      // Enforce that versions belong to this regulation (prevents IDOR)
      const [version1] = await db.select().from(regulationVersions)
        .where(and(
          eq(regulationVersions.id, v1 as string),
          eq(regulationVersions.regulationId, req.params.id)
        ));
      const [version2] = await db.select().from(regulationVersions)
        .where(and(
          eq(regulationVersions.id, v2 as string),
          eq(regulationVersions.regulationId, req.params.id)
        ));

      if (!version1 || !version2) {
        return res.status(404).json({ message: 'One or both versions not found for this regulation' });
      }

      // Compare snapshots
      const snapshot1 = (version1.snapshotJson as any[]) || [];
      const snapshot2 = (version2.snapshotJson as any[]) || [];

      const map1 = new Map(snapshot1.map(u => [u.unitKey, u]));
      const map2 = new Map(snapshot2.map(u => [u.unitKey, u]));

      const added = snapshot2.filter(u => !map1.has(u.unitKey));
      const removed = snapshot1.filter(u => !map2.has(u.unitKey));
      const modified = snapshot2.filter(u => {
        const prev = map1.get(u.unitKey);
        return prev && prev.textHash !== u.textHash;
      });

      res.json({
        version1: { id: version1.id, label: version1.versionLabel, number: version1.versionNumber },
        version2: { id: version2.id, label: version2.versionLabel, number: version2.versionNumber },
        changes: {
          added: added.map(u => ({ unitKey: u.unitKey, unitType: u.unitType })),
          removed: removed.map(u => ({ unitKey: u.unitKey, unitType: u.unitType })),
          modified: modified.map(u => ({ unitKey: u.unitKey, unitType: u.unitType }))
        },
        summary: {
          addedCount: added.length,
          removedCount: removed.length,
          modifiedCount: modified.length
        }
      });
    } catch (error) {
      console.error('Compare versions error:', error);
      res.status(500).json({ message: 'Failed to compare versions' });
    }
  });

  // Get AI audit log for a regulation (with org scoping)
  app.get('/api/regtech/regulations/:id/audit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      // Verify regulation belongs to user's org
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }
      
      const logs = await db.select().from(aiAuditLog)
        .where(eq(aiAuditLog.regulationId, req.params.id))
        .orderBy(aiAuditLog.createdAt)
        .limit(100);
      
      res.json(logs);
    } catch (error) {
      console.error('Get audit log error:', error);
      res.status(500).json({ message: 'Failed to get audit log' });
    }
  });

  // Extract obligations from legal units (with org scoping)
  const extractObligationsSchema = z.object({
    unitTypes: z.array(z.string()).optional().default(['section', 'subsection', 'paragraph', 'clause']),
    batchSize: z.number().min(1).max(20).optional().default(5)
  });
  
  app.post('/api/regtech/regulations/:id/extract-obligations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      // Validate input
      const parseResult = extractObligationsSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid parameters', errors: parseResult.error.errors });
      }
      const { unitTypes, batchSize } = parseResult.data;
      
      // Verify regulation belongs to user's org
      const [reg] = await db.select().from(regulations)
        .where(and(
          eq(regulations.id, req.params.id),
          eq(regulations.organizationId, orgId)
        ))
        .limit(1);
      
      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found' });
      }
      
      const { extractAllObligationsForRegulation } = await import('../services/obligationExtraction');
      
      const result = await extractAllObligationsForRegulation(req.params.id, {
        unitTypes,
        batchSize
      });
      
      res.json(result);
    } catch (error) {
      console.error('Extract obligations error:', error);
      res.status(500).json({ message: 'Failed to extract obligations' });
    }
  });


  // ============================================================================
  // Controls, Evidence, and Obligation Mapping Endpoints
  // ============================================================================

  // Get all controls for org
  app.get('/api/regtech/controls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const controls = await db.select().from(complianceControls)
        .where(eq(complianceControls.organizationId, orgId))
        .orderBy(complianceControls.createdAt);
      res.json(controls);
    } catch (error) {
      console.error('Get controls error:', error);
      res.status(500).json({ message: 'Failed to get controls' });
    }
  });

  // Create control
  app.post('/api/regtech/controls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { controlType, name, description, owner } = req.body;
      if (!controlType || !name || !description) {
        return res.status(400).json({ message: 'controlType, name, and description are required' });
      }
      
      const [control] = await db.insert(complianceControls).values({
        id: `ctl_${nanoid()}`,
        organizationId: orgId,
        controlType,
        name,
        description,
        owner: owner || null,
        isActive: true
      }).returning();
      
      res.json(control);
    } catch (error) {
      console.error('Create control error:', error);
      res.status(500).json({ message: 'Failed to create control' });
    }
  });

  // Update control
  app.patch('/api/regtech/controls/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { controlType, name, description, owner, isActive } = req.body;
      const [control] = await db.update(complianceControls)
        .set({ 
          ...(controlType && { controlType }),
          ...(name && { name }),
          ...(description && { description }),
          ...(owner !== undefined && { owner }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date()
        })
        .where(and(
          eq(complianceControls.id, req.params.id),
          eq(complianceControls.organizationId, orgId)
        ))
        .returning();
      
      if (!control) {
        return res.status(404).json({ message: 'Control not found' });
      }
      res.json(control);
    } catch (error) {
      console.error('Update control error:', error);
      res.status(500).json({ message: 'Failed to update control' });
    }
  });

  // Delete control
  app.delete('/api/regtech/controls/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      await db.delete(complianceControls)
        .where(and(
          eq(complianceControls.id, req.params.id),
          eq(complianceControls.organizationId, orgId)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete control error:', error);
      res.status(500).json({ message: 'Failed to delete control' });
    }
  });

  // Get all evidence for org
  app.get('/api/regtech/evidence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const evidence = await db.select().from(complianceEvidence)
        .where(eq(complianceEvidence.organizationId, orgId))
        .orderBy(complianceEvidence.createdAt);
      res.json(evidence);
    } catch (error) {
      console.error('Get evidence error:', error);
      res.status(500).json({ message: 'Failed to get evidence' });
    }
  });

  // Create evidence
  app.post('/api/regtech/evidence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { evidenceType, name, description, documentId, externalUrl, validFrom, validTo } = req.body;
      if (!evidenceType || !name) {
        return res.status(400).json({ message: 'evidenceType and name are required' });
      }
      
      const [evidence] = await db.insert(complianceEvidence).values({
        id: `ev_${nanoid()}`,
        organizationId: orgId,
        evidenceType,
        name,
        description: description || null,
        documentId: documentId || null,
        externalUrl: externalUrl || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null
      }).returning();
      
      res.json(evidence);
    } catch (error) {
      console.error('Create evidence error:', error);
      res.status(500).json({ message: 'Failed to create evidence' });
    }
  });

  // Update evidence
  app.patch('/api/regtech/evidence/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { evidenceType, name, description, documentId, externalUrl, validFrom, validTo } = req.body;
      const [evidence] = await db.update(complianceEvidence)
        .set({ 
          ...(evidenceType && { evidenceType }),
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(documentId !== undefined && { documentId }),
          ...(externalUrl !== undefined && { externalUrl }),
          ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
          ...(validTo !== undefined && { validTo: validTo ? new Date(validTo) : null }),
          updatedAt: new Date()
        })
        .where(and(
          eq(complianceEvidence.id, req.params.id),
          eq(complianceEvidence.organizationId, orgId)
        ))
        .returning();
      
      if (!evidence) {
        return res.status(404).json({ message: 'Evidence not found' });
      }
      res.json(evidence);
    } catch (error) {
      console.error('Update evidence error:', error);
      res.status(500).json({ message: 'Failed to update evidence' });
    }
  });

  // Delete evidence
  app.delete('/api/regtech/evidence/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      await db.delete(complianceEvidence)
        .where(and(
          eq(complianceEvidence.id, req.params.id),
          eq(complianceEvidence.organizationId, orgId)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete evidence error:', error);
      res.status(500).json({ message: 'Failed to delete evidence' });
    }
  });

  // Helper to verify obligation belongs to org
  async function verifyObligationOrgAccess(obligationId: string, orgId: string): Promise<boolean> {
    const [obl] = await db.select({ regId: regulatoryObligations.regulationId })
      .from(regulatoryObligations)
      .where(eq(regulatoryObligations.id, obligationId))
      .limit(1);
    if (!obl) return false;
    
    const [reg] = await db.select({ orgId: regulations.organizationId })
      .from(regulations)
      .where(eq(regulations.id, obl.regId))
      .limit(1);
    
    return reg?.orgId === orgId;
  }

  // Get obligation mappings for an obligation
  app.get('/api/regtech/obligations/:id/mappings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      // Verify obligation belongs to user's org
      if (!(await verifyObligationOrgAccess(req.params.id, orgId))) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const mappings = await db.select({
        mapping: obligationMappings,
        control: complianceControls,
        evidence: complianceEvidence
      })
        .from(obligationMappings)
        .leftJoin(complianceControls, eq(obligationMappings.controlId, complianceControls.id))
        .leftJoin(complianceEvidence, eq(obligationMappings.evidenceId, complianceEvidence.id))
        .where(eq(obligationMappings.obligationId, req.params.id));
      
      res.json(mappings);
    } catch (error) {
      console.error('Get obligation mappings error:', error);
      res.status(500).json({ message: 'Failed to get mappings' });
    }
  });

  // Create obligation mapping
  app.post('/api/regtech/obligations/:id/mappings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      const { controlId, evidenceId, status, notes } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'status is required' });
      }
      
      // Verify obligation belongs to user's org
      if (!(await verifyObligationOrgAccess(req.params.id, orgId))) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Verify control belongs to org if provided
      if (controlId) {
        const [ctl] = await db.select().from(complianceControls)
          .where(and(eq(complianceControls.id, controlId), eq(complianceControls.organizationId, orgId)))
          .limit(1);
        if (!ctl) return res.status(400).json({ message: 'Control not found or access denied' });
      }
      
      // Verify evidence belongs to org if provided
      if (evidenceId) {
        const [ev] = await db.select().from(complianceEvidence)
          .where(and(eq(complianceEvidence.id, evidenceId), eq(complianceEvidence.organizationId, orgId)))
          .limit(1);
        if (!ev) return res.status(400).json({ message: 'Evidence not found or access denied' });
      }
      
      const [mapping] = await db.insert(obligationMappings).values({
        id: `map_${nanoid()}`,
        obligationId: req.params.id,
        controlId: controlId || null,
        evidenceId: evidenceId || null,
        status,
        humanVerified: false,
        notes: notes || null
      }).returning();
      
      res.json(mapping);
    } catch (error) {
      console.error('Create mapping error:', error);
      res.status(500).json({ message: 'Failed to create mapping' });
    }
  });

  // Update mapping
  app.patch('/api/regtech/mappings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      // Get existing mapping and verify org access via obligation
      const [existingMapping] = await db.select().from(obligationMappings)
        .where(eq(obligationMappings.id, req.params.id))
        .limit(1);
      
      if (!existingMapping) {
        return res.status(404).json({ message: 'Mapping not found' });
      }
      
      if (!(await verifyObligationOrgAccess(existingMapping.obligationId, orgId))) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const { controlId, evidenceId, status, humanVerified, notes } = req.body;
      
      // Verify new control/evidence belong to org if provided
      if (controlId) {
        const [ctl] = await db.select().from(complianceControls)
          .where(and(eq(complianceControls.id, controlId), eq(complianceControls.organizationId, orgId)))
          .limit(1);
        if (!ctl) return res.status(400).json({ message: 'Control not found or access denied' });
      }
      
      if (evidenceId) {
        const [ev] = await db.select().from(complianceEvidence)
          .where(and(eq(complianceEvidence.id, evidenceId), eq(complianceEvidence.organizationId, orgId)))
          .limit(1);
        if (!ev) return res.status(400).json({ message: 'Evidence not found or access denied' });
      }
      
      const [mapping] = await db.update(obligationMappings)
        .set({ 
          ...(controlId !== undefined && { controlId }),
          ...(evidenceId !== undefined && { evidenceId }),
          ...(status && { status }),
          ...(humanVerified !== undefined && { humanVerified }),
          ...(notes !== undefined && { notes }),
          updatedAt: new Date()
        })
        .where(eq(obligationMappings.id, req.params.id))
        .returning();
      
      res.json(mapping);
    } catch (error) {
      console.error('Update mapping error:', error);
      res.status(500).json({ message: 'Failed to update mapping' });
    }
  });

  // Delete mapping
  app.delete('/api/regtech/mappings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const orgId = await requireOrganization(userId, res);
      if (!orgId) return;
      
      // Get existing mapping and verify org access via obligation
      const [existingMapping] = await db.select().from(obligationMappings)
        .where(eq(obligationMappings.id, req.params.id))
        .limit(1);
      
      if (!existingMapping) {
        return res.status(404).json({ message: 'Mapping not found' });
      }
      
      if (!(await verifyObligationOrgAccess(existingMapping.obligationId, orgId))) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await db.delete(obligationMappings)
        .where(eq(obligationMappings.id, req.params.id));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete mapping error:', error);
      res.status(500).json({ message: 'Failed to delete mapping' });
    }
  });

  // ============================================================================
  // RegTech Admin Routes - User and Organization Management
  // ============================================================================

  async function isRegtechAdmin(req: any): Promise<boolean> {
    if (!req.session.userId) return false;
    const user = await storage.getUser(req.session.userId);
    return user?.isAdmin === true;
  }

  // RegTech Admin - Get all organizations
  app.get('/api/regtech/admin/organizations', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const orgs = await db.select().from(regtechOrganizations).orderBy(regtechOrganizations.createdAt);
      res.json(orgs);
    } catch (error) {
      console.error('Get regtech organizations error:', error);
      res.status(500).json({ message: 'Failed to get organizations' });
    }
  });

  // RegTech Admin - Create organization
  app.post('/api/regtech/admin/organizations', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const { name, industry, domain } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Organization name is required' });
      }
      const [org] = await db.insert(regtechOrganizations).values({
        id: nanoid(),
        name,
        industry: industry || null,
        domain: domain || null,
      }).returning();
      res.json(org);
    } catch (error) {
      console.error('Create regtech organization error:', error);
      res.status(500).json({ message: 'Failed to create organization' });
    }
  });

  // RegTech Admin - Delete organization
  app.delete('/api/regtech/admin/organizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      await db.delete(regtechOrganizations).where(eq(regtechOrganizations.id, req.params.id));
      res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
      console.error('Delete regtech organization error:', error);
      res.status(500).json({ message: 'Failed to delete organization' });
    }
  });

  // RegTech Admin - Get all users
  app.get('/api/regtech/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      // Query main users table (where new signups go) with subscription info
      const mainUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
        isAdmin: users.isAdmin,
        isActive: sql<boolean>`true`.as('is_active'),
        subscriptionStatus: users.subscriptionStatus,
        trialEndsAt: users.trialEndsAt,
        accessExpiresAt: users.accessExpiresAt,
        createdAt: users.createdAt,
        source: sql<string>`'main'`.as('source'),
      }).from(users).orderBy(users.createdAt);

      // Query regtech users table for backwards compat
      const rtUsers = await db.select({
        id: regtechUsers.id,
        email: regtechUsers.email,
        firstName: regtechUsers.firstName,
        lastName: regtechUsers.lastName,
        role: regtechUsers.role,
        organizationId: regtechUsers.organizationId,
        isAdmin: regtechUsers.isAdmin,
        isActive: regtechUsers.isActive,
        subscriptionStatus: sql<string>`'active'`.as('subscription_status'),
        trialEndsAt: sql<Date | null>`null`.as('trial_ends_at'),
        accessExpiresAt: sql<Date | null>`null`.as('access_expires_at'),
        createdAt: regtechUsers.createdAt,
        source: sql<string>`'regtech'`.as('source'),
      }).from(regtechUsers).orderBy(regtechUsers.createdAt);

      // Merge, deduplicate by email
      const seenEmails = new Set<string>();
      const allUsers = [];
      for (const u of [...mainUsers, ...rtUsers]) {
        if (u.email && !seenEmails.has(u.email)) {
          seenEmails.add(u.email);
          allUsers.push(u);
        }
      }
      res.json(allUsers);
    } catch (error) {
      console.error('Get admin users error:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  // RegTech Admin - Create user
  app.post('/api/regtech/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const { email, password, firstName, lastName, role, organizationId } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      const existing = await db.select().from(regtechUsers).where(eq(regtechUsers.email, email)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const [user] = await db.insert(regtechUsers).values({
        id: nanoid(),
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || null,
        organizationId: organizationId || null,
        isAdmin: false,
        isActive: true,
      }).returning();
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Create regtech user error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // RegTech Admin - Delete user
  app.delete('/api/regtech/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const { id } = req.params;
      if (id === req.session.userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      await db.delete(regtechUsers).where(eq(regtechUsers.id, id));
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete regtech user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // RegTech Admin - Reset user password
  app.post('/api/regtech/admin/users/:id/reset-password', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(regtechUsers).set({ password: hashedPassword }).where(eq(regtechUsers.id, id));
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset regtech user password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Admin: Update user subscription plan
  app.post('/api/regtech/admin/users/:id/update-plan', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const { id } = req.params;
      const { subscriptionStatus } = req.body;
      if (!subscriptionStatus || !['trial', 'active', 'expired'].includes(subscriptionStatus)) {
        return res.status(400).json({ message: 'Invalid subscription status' });
      }
      const updates: any = { subscriptionStatus, updatedAt: new Date() };
      if (subscriptionStatus === 'active') {
        const exp = new Date();
        exp.setFullYear(exp.getFullYear() + 1);
        updates.accessExpiresAt = exp;
      }
      if (subscriptionStatus === 'trial') {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        updates.trialEndsAt = trialEnd;
      }
      await db.update(users).set(updates).where(eq(users.id, id));
      res.json({ message: 'Plan updated successfully' });
    } catch (error) {
      console.error('Update user plan error:', error);
      res.status(500).json({ message: 'Failed to update plan' });
    }
  });

  // Seed sample regulatory documents from various jurisdictions
  app.post('/api/regtech/admin/seed-documents', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await isRegtechAdmin(req))) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const sampleDocuments = [
        {
          title: "FinCEN Anti-Money Laundering Program Requirements",
          jurisdiction: "US",
          regulator: "FinCEN",
          instrumentType: "Regulation",
          url: "https://www.fincen.gov/resources/statutes-and-regulations",
          publishedAt: new Date("2024-06-15"),
          effectiveAt: new Date("2024-09-01"),
          extractedText: `FinCEN Anti-Money Laundering Program Requirements for Financial Institutions.

Section 1: Scope and Application
This regulation applies to all financial institutions as defined under the Bank Secrecy Act (BSA). Covered entities include banks, money service businesses, broker-dealers, mutual funds, and casinos.

Section 2: Risk-Based AML Program
2.1 Each financial institution must develop and implement a written AML program reasonably designed to prevent the institution from being used to facilitate money laundering and terrorist financing.

2.2 The AML program must include:
(a) Policies, procedures, and internal controls based on the institution's risk assessment
(b) Designation of a qualified compliance officer responsible for day-to-day AML compliance
(c) Ongoing employee training program
(d) Independent testing of the AML program
(e) Customer Due Diligence procedures including beneficial ownership identification

Section 3: Customer Due Diligence Requirements
3.1 Financial institutions must establish and maintain written CDD procedures that:
(a) Identify and verify the identity of customers
(b) Identify beneficial owners of legal entity customers
(c) Understand the nature and purpose of customer relationships
(d) Conduct ongoing monitoring for suspicious activity

Section 4: Suspicious Activity Reporting
Financial institutions must file Suspicious Activity Reports (SARs) with FinCEN within 30 calendar days of initial detection of facts that may constitute a basis for filing a SAR.

Section 5: Record Retention
All records related to AML compliance must be retained for a minimum of five years after the relevant account is closed or the transaction is completed.

Penalties: Violations may result in civil money penalties up to $1 million per day per violation and criminal penalties including imprisonment.`,
          status: "active",
        },
        {
          title: "FCA Financial Crime Guide: A Firm's Guide to Countering Financial Crime Risks",
          jurisdiction: "UK",
          regulator: "FCA",
          instrumentType: "Guidance",
          url: "https://www.fca.org.uk/publications/finalised-guidance/financial-crime-guide",
          publishedAt: new Date("2024-03-20"),
          effectiveAt: new Date("2024-04-01"),
          extractedText: `FCA Financial Crime Guide: A Firm's Guide to Countering Financial Crime Risks

Chapter 1: Introduction
1.1 Purpose: This guide helps firms understand the FCA's expectations regarding systems and controls to counter the risks of financial crime.

1.2 Scope: Applies to all FCA-authorized firms, including banks, building societies, investment firms, and payment service providers.

Chapter 2: Senior Management Responsibility
2.1 Firms must ensure senior management take clear responsibility for managing financial crime risk. The Senior Managers and Certification Regime (SM&CR) assigns specific accountabilities for AML.

2.2 The Money Laundering Reporting Officer (MLRO) must have:
(a) Sufficient seniority and independence
(b) Direct access to the board or governing body
(c) Adequate resources and systems
(d) Authority to act on compliance matters

Chapter 3: Risk Assessment
3.1 Firms must conduct a comprehensive risk assessment considering:
(a) Customer types and risk profiles
(b) Products and services offered
(c) Delivery channels
(d) Geographic exposure
(e) Transaction patterns

Chapter 4: Customer Due Diligence
4.1 Standard CDD must be applied to all customers at onboarding.
4.2 Enhanced Due Diligence (EDD) is required for:
(a) Politically Exposed Persons (PEPs)
(b) High-risk third countries
(c) Correspondent banking relationships
(d) Complex or unusual transaction patterns

Chapter 5: Transaction Monitoring
5.1 Firms must implement effective transaction monitoring systems proportionate to the nature, size, and complexity of their business.

Enforcement: The FCA may take enforcement action including public censure, financial penalties, and prohibition of individuals from performing regulated activities.`,
          status: "active",
        },
        {
          title: "EU 6th Anti-Money Laundering Directive (6AMLD) Implementation Guidelines",
          jurisdiction: "EU",
          regulator: "EBA",
          instrumentType: "Directive",
          url: "https://www.eba.europa.eu/regulation-and-policy/anti-money-laundering-and-countering-financing-terrorism",
          publishedAt: new Date("2024-01-15"),
          effectiveAt: new Date("2024-06-30"),
          extractedText: `EU 6th Anti-Money Laundering Directive (6AMLD) Implementation Guidelines

Article 1: Objectives
This Directive establishes rules to prevent the use of the Union financial system for the purposes of money laundering and terrorist financing.

Article 2: Obliged Entities
2.1 The following entities are subject to this Directive:
(a) Credit institutions
(b) Financial institutions
(c) Auditors and external accountants
(d) Tax advisors
(e) Real estate agents
(f) Crypto-asset service providers
(g) High-value goods dealers

Article 3: Criminal Offences
3.1 Member States must ensure the following are punishable as criminal offences:
(a) Conversion or transfer of property derived from criminal activity
(b) Concealment or disguise of the true nature of property
(c) Acquisition, possession or use of proceeds of crime
(d) Participation in or facilitation of any of the above

Article 4: Extended Criminal Liability
4.1 This Directive introduces criminal liability for legal persons for AML violations.
4.2 Aiding, abetting, and attempting money laundering are now explicitly criminalized across all Member States.

Article 5: Enhanced Penalties
5.1 Minimum imprisonment terms:
(a) Standard cases: Minimum 4 years imprisonment
(b) Aggravated cases: Minimum penalties as determined by Member States
5.2 Aggravating circumstances include connection to organized crime or public official involvement.

Article 6: Predicate Offences
The harmonized list of 22 predicate offences includes: terrorism, trafficking, corruption, fraud, cybercrime, environmental crimes, and tax crimes.

Transposition Deadline: Member States must transpose this Directive into national law by June 30, 2024.`,
          status: "active",
        },
        {
          title: "MAS Notice on Prevention of Money Laundering and Countering Terrorism Financing",
          jurisdiction: "SG",
          regulator: "MAS",
          instrumentType: "Notice",
          url: "https://www.mas.gov.sg/regulation/notices/notice-626",
          publishedAt: new Date("2024-04-10"),
          effectiveAt: new Date("2024-07-01"),
          extractedText: `MAS Notice 626 - Prevention of Money Laundering and Countering the Financing of Terrorism

Part I: Preliminary
1. Citation: This Notice may be cited as MAS Notice 626.
2. Application: This Notice applies to all banks licensed under the Banking Act.

Part II: Customer Due Diligence
3. Identification Requirements
3.1 A bank shall identify each customer and verify the customer's identity using reliable, independent source documents.
3.2 For natural persons: Full name, date of birth, nationality, residential address, and unique identification number.
3.3 For legal persons: Full name, registration number, date and place of incorporation, registered address, and beneficial owners.

4. Beneficial Ownership
4.1 Banks must identify all beneficial owners who ultimately own or control more than 25% of the shares or voting rights.
4.2 Where no natural person is identified, the bank shall identify the senior managing official.

Part III: Enhanced Customer Due Diligence
5. Higher Risk Categories
5.1 EDD measures are required for:
(a) Customers from high-risk countries identified by FATF
(b) Politically Exposed Persons (PEPs) - domestic and foreign
(c) Private banking customers
(d) Correspondent banking relationships
(e) Non-face-to-face business relationships

Part IV: Suspicious Transaction Reporting
6. STR Requirements
6.1 Banks must file Suspicious Transaction Reports (STRs) with the Suspicious Transaction Reporting Office within 15 business days of forming reasonable grounds to suspect money laundering or terrorism financing.

Part V: Record Keeping
7. Retention Period
7.1 All CDD records must be retained for at least 5 years after the business relationship has ended.
7.2 Transaction records must be retained for at least 5 years from the date of the transaction.

Penalties: Contraventions may result in penalties up to SGD 1 million per breach.`,
          status: "active",
        },
        {
          title: "HKMA Guideline on Anti-Money Laundering and Counter-Terrorist Financing",
          jurisdiction: "HK",
          regulator: "HKMA",
          instrumentType: "Guideline",
          url: "https://www.hkma.gov.hk/eng/regulatory-resources/regulatory-guides/anti-money-laundering-guidance/",
          publishedAt: new Date("2024-02-28"),
          effectiveAt: new Date("2024-05-01"),
          extractedText: `HKMA Guideline on Anti-Money Laundering and Counter-Terrorist Financing for Authorized Institutions

Chapter 1: Scope and General Principles
1.1 This Guideline applies to all authorized institutions (AIs) in Hong Kong, including licensed banks, restricted licence banks, and deposit-taking companies.

1.2 Core Principles:
(a) Risk-based approach to AML/CFT
(b) Senior management accountability
(c) Comprehensive policies and procedures
(d) Effective internal controls and compliance monitoring

Chapter 2: ML/TF Risk Assessment
2.1 AIs must conduct enterprise-wide ML/TF risk assessments covering:
(a) Customer risks
(b) Product/service risks
(c) Delivery channel risks
(d) Geographic risks

2.2 Risk assessments must be documented and updated at least annually.

Chapter 3: Customer Due Diligence
3.1 Standard CDD Requirements:
(a) Customer identification and verification
(b) Beneficial ownership identification
(c) Understanding the purpose of account/relationship
(d) Ongoing monitoring

3.2 Simplified Due Diligence (SDD):
SDD may be applied where lower ML/TF risks have been identified.

3.3 Enhanced Due Diligence (EDD):
Required for PEPs, correspondent banking, private banking, and high-risk situations.

Chapter 4: Sanctions Screening
4.1 AIs must screen customers and transactions against:
(a) UN Security Council sanctions lists
(b) Hong Kong sanctions lists
(c) OFAC and other relevant sanctions lists

Chapter 5: Transaction Monitoring
5.1 AIs must implement automated and manual transaction monitoring appropriate to their risk profile.

5.2 Suspicious Transaction Reports (STRs) must be filed with the Joint Financial Intelligence Unit (JFIU) as soon as reasonably practicable.

Enforcement: The HKMA may take disciplinary action including monetary penalties up to HKD 10 million.`,
          status: "active",
        },
        {
          title: "FATF Updated Guidance on Beneficial Ownership",
          jurisdiction: "GLOBAL",
          regulator: "FATF",
          instrumentType: "Guidance",
          url: "https://www.fatf-gafi.org/en/publications/fatfrecommendations/documents/guidance-beneficial-ownership.html",
          publishedAt: new Date("2024-05-01"),
          effectiveAt: new Date("2024-05-01"),
          extractedText: `FATF Guidance on Beneficial Ownership and Transparency

Section 1: Introduction
1.1 This Guidance assists countries in implementing FATF Recommendations 24 and 25 on transparency and beneficial ownership of legal persons and arrangements.

1.2 Beneficial ownership information is essential for:
(a) Combating money laundering
(b) Preventing terrorist financing
(c) Tax evasion prevention
(d) Corruption investigation

Section 2: Definition of Beneficial Owner
2.1 A beneficial owner is the natural person who ultimately owns or controls a customer or on whose behalf a transaction is conducted.

2.2 Ownership threshold: Countries should use a 25% ownership threshold as a starting point, with flexibility to apply lower thresholds for higher-risk situations.

Section 3: Beneficial Ownership Registries
3.1 Countries should ensure that beneficial ownership information is held in a central register or an alternative mechanism.

3.2 Registry requirements:
(a) Information must be adequate, accurate, and current
(b) Timely access for competent authorities
(c) Access for financial institutions for CDD purposes
(d) Appropriate sanctions for non-compliance

Section 4: Verification and Accuracy
4.1 Countries must ensure mechanisms exist for verifying beneficial ownership information.

4.2 Verification may include:
(a) Reliance on information from companies and shareholders
(b) Cross-checking with other data sources
(c) Risk-based verification procedures

Section 5: Access to Information
5.1 Competent authorities should have timely access to beneficial ownership information.
5.2 FIUs and law enforcement must be able to obtain information rapidly without alerting the persons involved.

Section 6: International Cooperation
Countries should ensure that beneficial ownership information can be exchanged with foreign competent authorities in a timely manner.

Compliance Timeline: Countries should demonstrate substantial progress by the next mutual evaluation round.`,
          status: "active",
        },
        {
          title: "FIU-IND Circular on Virtual Asset Compliance Requirements",
          jurisdiction: "IN",
          regulator: "FIU-IND",
          instrumentType: "Circular",
          url: "https://fiuindia.gov.in/files/policy-circular",
          publishedAt: new Date("2024-07-01"),
          effectiveAt: new Date("2024-10-01"),
          extractedText: `FIU-IND Circular: Virtual Asset Service Provider Compliance Requirements

1. Introduction
This circular provides guidance on Anti-Money Laundering (AML) and Countering the Financing of Terrorism (CFT) compliance requirements for Virtual Asset Service Providers (VASPs) operating in India.

2. Registration Requirements
2.1 All VASPs must register with FIU-IND before commencing operations.
2.2 Registration applications must include:
(a) Details of promoters and key management personnel
(b) Technology infrastructure details
(c) AML/CFT policy framework
(d) Risk assessment methodology

3. Customer Due Diligence for Virtual Assets
3.1 VASPs must perform KYC verification for all customers before allowing transactions.
3.2 Enhanced verification required for:
(a) Transactions exceeding INR 50,000
(b) Cross-border virtual asset transfers
(c) Transactions involving privacy coins
(d) Multiple wallet addresses per customer

4. Travel Rule Compliance
4.1 VASPs must collect and transmit originator and beneficiary information for all virtual asset transfers exceeding INR 50,000.
4.2 Required information includes name, account number, and transaction reference.

5. Transaction Monitoring
5.1 VASPs must implement automated monitoring systems capable of:
(a) Detecting unusual transaction patterns
(b) Identifying high-risk wallet addresses
(c) Screening against sanctions lists
(d) Flagging structuring behavior

6. Reporting Requirements
6.1 Suspicious Transaction Reports (STRs) must be filed within 7 days.
6.2 Cash Transaction Reports (CTRs) for transactions exceeding INR 10 lakh.
6.3 Monthly compliance reports to FIU-IND.

7. Record Keeping
All transaction records and KYC documents must be maintained for 10 years from the date of transaction or end of relationship.

Non-Compliance Penalties: Penalties up to INR 25 crore and potential criminal prosecution.`,
          status: "active",
        },
        {
          title: "AUSTRAC AML/CTF Rules Amendment: Enhanced Customer Due Diligence",
          jurisdiction: "AU",
          regulator: "AUSTRAC",
          instrumentType: "Amendment",
          url: "https://www.austrac.gov.au/business/how-comply-and-report-guidance-and-resources/amlctf-rules",
          publishedAt: new Date("2024-08-15"),
          effectiveAt: new Date("2025-01-01"),
          extractedText: `AUSTRAC AML/CTF Rules Amendment 2024: Enhanced Customer Due Diligence Requirements

Part 1: Preliminary
1. Title: Anti-Money Laundering and Counter-Terrorism Financing Rules Amendment (Enhanced CDD) 2024

2. Commencement: These Rules commence on 1 January 2025.

Part 2: Amendments to Customer Identification Procedures
3. Enhanced Verification for High-Risk Customers
3.1 Reporting entities must apply enhanced customer due diligence measures where:
(a) The customer is a politically exposed person (PEP)
(b) The customer is from a high-risk jurisdiction listed in the Minister's rules
(c) The designated service involves transactions over AUD 100,000
(d) The customer uses complex corporate structures

4. Beneficial Ownership Requirements
4.1 Reporting entities must identify all beneficial owners with more than 25% ownership or control.
4.2 Where beneficial owners cannot be identified, the entity must:
(a) Document the reasons
(b) Apply enhanced monitoring
(c) Consider whether to proceed with the relationship

Part 3: Ongoing Customer Due Diligence
5. Periodic Review Requirements
5.1 Customer information must be reviewed and updated:
(a) High-risk customers: Every 12 months
(b) Medium-risk customers: Every 24 months
(c) Low-risk customers: Every 36 months

6. Trigger-Based Reviews
6.1 Immediate review required when:
(a) Significant transaction outside normal pattern
(b) Change in customer risk profile
(c) Adverse media or intelligence received
(d) Sanctions list updates affecting the customer

Part 4: Record Keeping
7. Documentation Standards
7.1 All CDD records must be retained for 7 years after the end of the customer relationship.
7.2 Records must be stored securely and be retrievable within 48 hours.

Penalties: Civil penalties up to AUD 22 million for body corporates and AUD 1.1 million for individuals.`,
          status: "active",
        },
      ];

      const createdDocs = [];
      for (const doc of sampleDocuments) {
        const existingDocs = await storage.getRegulatoryDocuments({ 
          jurisdiction: doc.jurisdiction, 
          regulator: doc.regulator 
        });
        const alreadyExists = existingDocs.some(d => d.title === doc.title);
        
        if (!alreadyExists) {
          const created = await storage.createRegulatoryDocument({
            title: doc.title,
            jurisdiction: doc.jurisdiction,
            regulator: doc.regulator,
            instrumentType: doc.instrumentType,
            url: doc.url,
            publishedAt: doc.publishedAt,
            effectiveAt: doc.effectiveAt,
            extractedText: doc.extractedText,
            status: doc.status,
            contentHash: nanoid(),
            uploadedBy: req.session.userId,
          });
          createdDocs.push(created);
        }
      }

      res.json({ 
        message: `Seeded ${createdDocs.length} sample regulatory documents`,
        documents: createdDocs.map(d => ({ id: d.id, title: d.title, jurisdiction: d.jurisdiction, regulator: d.regulator }))
      });
    } catch (error) {
      console.error('Seed documents error:', error);
      res.status(500).json({ message: 'Failed to seed documents' });
    }
  });

  // ============= Web Alert Set Routes =============
  
  app.get('/api/regtech/web-alert-sets', isAuthenticated, async (req: any, res) => {
    try {
      const alertSets = await storage.getUserWebAlertSets(req.session.userId);
      res.json(alertSets);
    } catch (error) {
      console.error('Get web alert sets error:', error);
      res.status(500).json({ message: 'Failed to fetch alert sets' });
    }
  });

  app.post('/api/regtech/web-alert-sets', isAuthenticated, async (req: any, res) => {
    try {
      const webAlertSetSchema = z.object({
        name: z.string().min(1, 'Name is required').max(200),
        region: z.string().min(1, 'Region is required'),
        jurisdictions: z.array(z.string()).min(1, 'At least one jurisdiction is required'),
        keywords: z.array(z.string()).nullable().optional(),
        cadence: z.enum(['daily', 'weekly', 'monthly']).optional().default('weekly'),
      });
      const validation = webAlertSetSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }
      const { name, region, jurisdictions, keywords, cadence } = validation.data;
      
      const alertSet = await storage.createWebAlertSet({
        userId: req.session.userId,
        name,
        region,
        jurisdictions,
        keywords: keywords || null,
        cadence: cadence || 'weekly',
        isActive: true,
      });
      
      res.json(alertSet);
    } catch (error) {
      console.error('Create web alert set error:', error);
      res.status(500).json({ message: 'Failed to create alert set' });
    }
  });

  app.patch('/api/regtech/web-alert-sets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const alertSet = await storage.getWebAlertSet(id);
      
      if (!alertSet || alertSet.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Alert set not found' });
      }
      
      const allowedFields = ['name', 'region', 'jurisdictions', 'keywords', 'cadence', 'isActive'];
      const safeUpdates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          safeUpdates[field] = req.body[field];
        }
      }
      
      const updated = await storage.updateWebAlertSet(id, safeUpdates);
      res.json(updated);
    } catch (error) {
      console.error('Update web alert set error:', error);
      res.status(500).json({ message: 'Failed to update alert set' });
    }
  });

  app.delete('/api/regtech/web-alert-sets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const alertSet = await storage.getWebAlertSet(id);
      
      if (!alertSet || alertSet.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Alert set not found' });
      }
      
      await storage.deleteWebAlertSet(id);
      res.json({ message: 'Alert set deleted' });
    } catch (error) {
      console.error('Delete web alert set error:', error);
      res.status(500).json({ message: 'Failed to delete alert set' });
    }
  });

  app.post('/api/regtech/web-alert-sets/:id/scan', isAuthenticated, aiRateLimit, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const alertSet = await storage.getWebAlertSet(id);
      
      if (!alertSet || alertSet.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Alert set not found' });
      }
      
      const { scanAlertSet } = await import('../services/webAlertScanner');
      const alerts = await scanAlertSet(alertSet);
      
      // Get existing alert URLs to calculate actual new count
      const existingAlerts = await storage.getUserWebAlerts(req.session.userId);
      const existingUrls = new Set(existingAlerts.map(a => a.sourceUrl));
      const newAlerts = alerts.filter(alert => !existingUrls.has(alert.sourceUrl ?? null));
      
      if (alerts.length > 0) {
        await storage.createWebAlerts(alerts);
      }
      
      await storage.updateWebAlertSetLastScanned(id);
      
      res.json({ 
        message: newAlerts.length > 0 
          ? `Scan complete. Found ${newAlerts.length} new alert${newAlerts.length === 1 ? '' : 's'}.`
          : 'Scan complete. No new alerts found.',
        alertsCount: newAlerts.length,
      });
    } catch (error) {
      console.error('Scan web alert set error:', error);
      res.status(500).json({ message: 'Failed to scan for alerts' });
    }
  });

  // ============= Web Alert Routes =============
  
  app.get('/api/regtech/web-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const alerts = await storage.getUserWebAlerts(req.session.userId, status);
      res.json(alerts);
    } catch (error) {
      console.error('Get web alerts error:', error);
      res.status(500).json({ message: 'Failed to fetch web alerts' });
    }
  });

  app.patch('/api/regtech/web-alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.getWebAlert(id);
      
      if (!alert || alert.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      const allowedFields = ['status'];
      const safeUpdates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          safeUpdates[field] = req.body[field];
        }
      }
      
      const updated = await storage.updateWebAlert(id, safeUpdates);
      res.json(updated);
    } catch (error) {
      console.error('Update web alert error:', error);
      res.status(500).json({ message: 'Failed to update alert' });
    }
  });

  app.patch('/api/regtech/web-alerts/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.getWebAlert(id);
      
      if (!alert || alert.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      const updated = await storage.markWebAlertAsRead(id);
      res.json(updated);
    } catch (error) {
      console.error('Mark web alert as read error:', error);
      res.status(500).json({ message: 'Failed to mark alert as read' });
    }
  });

  app.delete('/api/regtech/web-alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.getWebAlert(id);
      
      if (!alert || alert.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      await storage.deleteWebAlert(id);
      res.json({ message: 'Alert deleted' });
    } catch (error) {
      console.error('Delete web alert error:', error);
      res.status(500).json({ message: 'Failed to delete alert' });
    }
  });

  // ============= Document Folders Routes =============

  app.get('/api/regtech/folders', isAuthenticated, async (req: any, res) => {
    try {
      const folders = await storage.getUserFolders(req.session.userId);
      res.json(folders);
    } catch (error) {
      console.error('Get folders error:', error);
      res.status(500).json({ message: 'Failed to fetch folders' });
    }
  });

  const createFolderSchema = z.object({
    name: z.string().min(1, 'Folder name is required').max(255),
    parentId: z.number().nullable().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').nullable().optional(),
  });

  app.post('/api/regtech/folders', isAuthenticated, async (req: any, res) => {
    try {
      const validation = createFolderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }

      const { name, parentId, color } = validation.data;

      let depth = 0;
      if (parentId) {
        const parentFolder = await storage.getFolder(parentId);
        if (!parentFolder || parentFolder.userId !== req.session.userId) {
          return res.status(404).json({ message: 'Parent folder not found' });
        }
        depth = (parentFolder.depth || 0) + 1;
        if (depth > 4) {
          return res.status(400).json({ message: 'Maximum folder depth (5 levels) exceeded' });
        }
      }

      const folder = await storage.createFolder({
        userId: req.session.userId,
        name: name.trim(),
        parentId: parentId || null,
        depth,
        color: color || null,
      });

      res.status(201).json(folder);
    } catch (error) {
      console.error('Create folder error:', error);
      res.status(500).json({ message: 'Failed to create folder' });
    }
  });

  app.patch('/api/regtech/folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const folder = await storage.getFolder(id);
      
      if (!folder || folder.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      const { name, color, parentId } = req.body;
      const updates: Record<string, any> = {};
      
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({ message: 'Folder name cannot be empty' });
        }
        updates.name = name.trim();
      }
      
      if (color !== undefined) {
        updates.color = color;
      }

      if (parentId !== undefined && parentId !== folder.parentId) {
        if (parentId === id) {
          return res.status(400).json({ message: 'Folder cannot be its own parent' });
        }
        
        if (parentId === null) {
          updates.parentId = null;
          updates.depth = 0;
        } else {
          const newParent = await storage.getFolder(parentId);
          if (!newParent || newParent.userId !== req.session.userId) {
            return res.status(404).json({ message: 'Parent folder not found' });
          }
          const newDepth = (newParent.depth || 0) + 1;
          if (newDepth > 4) {
            return res.status(400).json({ message: 'Maximum folder depth (5 levels) exceeded' });
          }
          updates.parentId = parentId;
          updates.depth = newDepth;
        }
      }

      const updated = await storage.updateFolder(id, updates);
      res.json(updated);
    } catch (error) {
      console.error('Update folder error:', error);
      res.status(500).json({ message: 'Failed to update folder' });
    }
  });

  app.delete('/api/regtech/folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const folder = await storage.getFolder(id);
      
      if (!folder || folder.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      await storage.deleteFolder(id);
      res.json({ message: 'Folder deleted' });
    } catch (error) {
      console.error('Delete folder error:', error);
      res.status(500).json({ message: 'Failed to delete folder' });
    }
  });

  app.get('/api/regtech/folders/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const folder = await storage.getFolder(id);
      
      if (!folder || folder.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      const documents = await storage.getFolderDocuments(id);
      res.json(documents);
    } catch (error) {
      console.error('Get folder documents error:', error);
      res.status(500).json({ message: 'Failed to fetch folder documents' });
    }
  });

  app.post('/api/regtech/folders/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const { docId } = req.body;

      if (!docId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }

      const folder = await storage.getFolder(folderId);
      if (!folder || folder.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      const document = await storage.getRegulatoryDocument(docId);
      if (!document || document.uploadedBy !== req.session.userId) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const existing = await storage.getFolderItem(folderId, docId);
      if (existing) {
        return res.json({ message: 'Document already in folder', item: existing });
      }

      const item = await storage.addDocumentToFolder(folderId, docId);
      res.status(201).json(item);
    } catch (error) {
      console.error('Add document to folder error:', error);
      res.status(500).json({ message: 'Failed to add document to folder' });
    }
  });

  app.delete('/api/regtech/folders/:id/documents/:docId', isAuthenticated, async (req: any, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const docId = parseInt(req.params.docId);

      const folder = await storage.getFolder(folderId);
      if (!folder || folder.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      await storage.removeDocumentFromFolder(folderId, docId);
      res.json({ message: 'Document removed from folder' });
    } catch (error) {
      console.error('Remove document from folder error:', error);
      res.status(500).json({ message: 'Failed to remove document from folder' });
    }
  });

  app.get('/api/regtech/documents/:id/folders', isAuthenticated, async (req: any, res) => {
    try {
      const docId = parseInt(req.params.id);
      const document = await storage.getRegulatoryDocument(docId);
      
      if (!document || document.uploadedBy !== req.session.userId) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const folders = await storage.getDocumentFolders(docId);
      res.json(folders);
    } catch (error) {
      console.error('Get document folders error:', error);
      res.status(500).json({ message: 'Failed to fetch document folders' });
    }
  });
}

async function generateAlertsForNewDocument(
  document: any,
  obligations: any[],
  uploadingUserId: string
): Promise<void> {
  try {
    const profiles = await storage.getMatchingUserProfiles({
      jurisdiction: document.jurisdiction,
      regulator: document.regulator,
    });
    
    const persistedObligations = await storage.getObligationsByDocId(document.id);
    
    const alertedUsers = new Set<string>();
    
    for (const profile of profiles) {
      if (alertedUsers.has(profile.userId)) {
        continue;
      }
      
      const relevantObligations = persistedObligations.filter(obl => 
        !profile.topics || profile.topics.length === 0 || 
        profile.topics.includes(obl.area)
      );
      
      const impactScore = calculateImpactScore(relevantObligations);
      
      const highImpactObligations = relevantObligations
        .sort((a, b) => {
          const scoreA = (a.deadline ? 2 : 0) + (a.penalty ? 1 : 0);
          const scoreB = (b.deadline ? 2 : 0) + (b.penalty ? 1 : 0);
          return scoreB - scoreA;
        })
        .slice(0, 5);
      
      const actionItems = highImpactObligations.map(obl => ({
        area: obl.area,
        requirement: obl.requirement,
        deadline: obl.deadline || null,
      }));
      
      await storage.createAlert({
        userId: profile.userId,
        docId: document.id,
        changesetId: null,
        alertType: 'new_document',
        title: `New ${document.regulator} regulation: ${document.title}`,
        summary: `A new ${document.instrumentType || 'document'} from ${document.regulator} (${document.jurisdiction}) has been published. ${relevantObligations.length} relevant obligations identified.`,
        impactScore: impactScore.toString(),
        actionItems,
        status: 'unread',
      });
      
      alertedUsers.add(profile.userId);
    }
    
    console.log(`Generated ${alertedUsers.size} alerts for document ${document.id}`);
  } catch (error) {
    console.error('Alert generation error:', error);
  }
}

async function generateAlertsForChangeset(
  changeset: any,
  newDocument: any,
  oldDocument: any
): Promise<void> {
  try {
    const profiles = await storage.getMatchingUserProfiles({
      jurisdiction: newDocument.jurisdiction,
      regulator: newDocument.regulator,
    });
    
    const alertedUsers = new Set<string>();
    
    for (const profile of profiles) {
      if (alertedUsers.has(profile.userId)) {
        continue;
      }
      
      const impactScore = changeset.impactScore || 5;
      
      await storage.createAlert({
        userId: profile.userId,
        docId: newDocument.id,
        changesetId: changeset.id,
        alertType: 'updated_document',
        title: `Update to ${newDocument.regulator} regulation: ${newDocument.title}`,
        summary: changeset.diffSummary || 'Document has been updated. Review changes to ensure compliance.',
        impactScore: impactScore.toString(),
        actionItems: [],
        status: 'unread',
      });
      
      alertedUsers.add(profile.userId);
    }
    
    console.log(`Generated ${alertedUsers.size} changeset alerts for document ${newDocument.id}`);
  } catch (error) {
    console.error('Changeset alert generation error:', error);
  }
}

function calculateImpactScore(obligations: any[]): number {
  if (obligations.length === 0) return 0;
  
  let score = Math.min(obligations.length * 0.5, 5);
  
  const highPriorityAreas = ['Sanctions', 'Reporting', 'KYC'];
  const highPriorityCount = obligations.filter(obl => 
    highPriorityAreas.includes(obl.area)
  ).length;
  
  score += Math.min(highPriorityCount * 0.5, 3);
  
  const withDeadlines = obligations.filter(obl => obl.deadline).length;
  score += Math.min(withDeadlines * 0.3, 2);
  
  return Math.min(score, 10);
}

async function extractObligations(
  docId: number,
  text: string,
  jurisdiction: string,
  regulator: string
): Promise<any[]> {
  try {
    const obligationPrompt = `Extract all regulatory obligations from this ${regulator} (${jurisdiction}) document.

Document text (first 6000 characters):
${text.substring(0, 6000)}

Return JSON array of obligations in this exact format:
{
  "obligations": [
    {
      "area": "KYC|Sanctions|Reporting|RecordKeeping|Training|Others",
      "actor": "Bank|NBFC|VASP|PSP|EMI|Brokerage|Fintech|All",
      "requirement": "Plain-language obligation",
      "deadline": "ISO date or null",
      "penalty": "Text or null",
      "citation_ref": { "url": "document_url", "section": "section_reference" }
    }
  ]
}

Every obligation MUST include a citation_ref with section reference.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: obligationPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }

    const result = JSON.parse(content);
    const obligations = result.obligations || [];

    const insertPromises = obligations.map((obl: any) =>
      storage.createObligation({
        docId,
        area: obl.area,
        actor: obl.actor,
        requirement: obl.requirement,
        deadline: obl.deadline ? new Date(obl.deadline) : null,
        penalty: obl.penalty,
        citationRef: obl.citation_ref,
        impactScore: null,
      })
    );

    await Promise.all(insertPromises);
    return obligations;

  } catch (error) {
    console.error('Obligation extraction error:', error);
    return [];
  }
}

async function generateDocumentSummary(
  text: string,
  title: string,
  jurisdiction: string,
  regulator: string
): Promise<string> {
  try {
    const summaryPrompt = `Summarize this regulatory document from ${regulator} (${jurisdiction}) in 2-3 concise sentences. Focus on the main purpose, key requirements, and who it affects.

Title: ${title}

Document text (first 3000 characters):
${text.substring(0, 3000)}

Provide a brief, professional summary without special formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: summaryPrompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    return sanitizeLLMResponse(response.choices[0].message.content || '');

  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Summary generation failed.';
  }
}
