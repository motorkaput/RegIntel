import { storage } from '../storage';
import { generateEmbedding } from './regTechEmbeddings';
import type { DocumentChunk, RegulatoryDocument } from '@shared/schema';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  document: RegulatoryDocument;
  score: number;
  similarity?: number;
  source: 'vector' | 'keyword' | 'hybrid';
}

export interface RetrievalFilters {
  jurisdiction?: string;
  regulator?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  docIds?: number[];
  userIds?: string[];
}

export async function hybridSearch(
  query: string,
  filters?: RetrievalFilters,
  limit: number = 10
): Promise<RetrievalResult[]> {
  try {
    const [vectorResults, keywordResults] = await Promise.all([
      vectorSearch(query, filters, limit * 2),
      keywordSearch(query, filters, limit * 2),
    ]);

    return mergeAndRankResults(vectorResults, keywordResults, limit);
  } catch (error) {
    console.error('Hybrid search failed:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function vectorSearch(
  query: string,
  filters?: RetrievalFilters,
  limit: number = 10
): Promise<RetrievalResult[]> {
  try {
  const embedding = await generateEmbedding(query);

  const chunks = await storage.searchSimilarChunks(
    embedding,
    limit,
    {
      jurisdiction: filters?.jurisdiction,
      regulator: filters?.regulator,
      userId: filters?.userId,
      docIds: filters?.docIds,
      userIds: filters?.userIds,
    }
  );
  
  const uniqueDocIds = Array.from(new Set(chunks.map(c => c.docId)));
  const documents = await Promise.all(
    uniqueDocIds.map(id => storage.getRegulatoryDocument(id))
  );
  const documentMap = new Map(
    documents.filter(d => d !== undefined).map(d => [d!.id, d!])
  );
  
  const results: RetrievalResult[] = [];
  
  for (const chunk of chunks) {
    const document = documentMap.get(chunk.docId);
    if (!document) continue;
    
    if (filters?.startDate && document.publishedAt && document.publishedAt < filters.startDate) {
      continue;
    }
    if (filters?.endDate && document.publishedAt && document.publishedAt > filters.endDate) {
      continue;
    }
    
    results.push({
      chunk: chunk as DocumentChunk,
      document,
      score: chunk.similarity,
      similarity: chunk.similarity,
      source: 'vector',
    });
  }
  
  return results;
  } catch (error) {
    console.error('Vector search failed:', error);
    return [];
  }
}

export async function keywordSearch(
  query: string,
  filters?: RetrievalFilters,
  limit: number = 10
): Promise<RetrievalResult[]> {
  try {
  const documents = await storage.searchRegulatoryDocuments(
    query,
    {
      jurisdiction: filters?.jurisdiction,
      regulator: filters?.regulator,
      userId: filters?.userId,
      docIds: filters?.docIds,
      userIds: filters?.userIds,
    }
  );
  
  const filteredDocs = documents.filter(doc => {
    if (filters?.startDate && doc.publishedAt && doc.publishedAt < filters.startDate) {
      return false;
    }
    if (filters?.endDate && doc.publishedAt && doc.publishedAt > filters.endDate) {
      return false;
    }
    return true;
  });
  
  const chunksPromises = filteredDocs.map(doc => 
    storage.getDocumentChunks(doc.id).then(chunks => ({ doc, chunks }))
  );
  
  const allDocChunks = await Promise.all(chunksPromises);
  
  const results: RetrievalResult[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

  if (queryTerms.length === 0) return [];

  for (const { doc, chunks } of allDocChunks) {
    for (const chunk of chunks) {
      const chunkText = chunk.text.toLowerCase();
      let matchScore = 0;

      for (const term of queryTerms) {
        const escapedTerm = escapeRegExp(term);
        const occurrences = (chunkText.match(new RegExp(escapedTerm, 'g')) || []).length;
        matchScore += occurrences;
      }
      
      if (matchScore > 0) {
        results.push({
          chunk,
          document: doc,
          score: matchScore / queryTerms.length,
          source: 'keyword',
        });
      }
    }
    
    if (results.length >= limit * 2) break;
  }
  
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('Keyword search failed:', error);
    return [];
  }
}

function mergeAndRankResults(
  vectorResults: RetrievalResult[],
  keywordResults: RetrievalResult[],
  limit: number
): RetrievalResult[] {
  const resultMap = new Map<number, RetrievalResult>();
  
  const maxVectorScore = vectorResults.length > 0 ? Math.max(...vectorResults.map(r => r.score)) : 1;
  const maxKeywordScore = keywordResults.length > 0 ? Math.max(...keywordResults.map(r => r.score)) : 1;
  
  for (const result of vectorResults) {
    const normalizedScore = result.score / maxVectorScore;
    resultMap.set(result.chunk.id, {
      ...result,
      score: normalizedScore * 0.7,
      source: 'vector',
    });
  }
  
  for (const result of keywordResults) {
    const normalizedScore = result.score / maxKeywordScore;
    const existing = resultMap.get(result.chunk.id);
    
    if (existing) {
      resultMap.set(result.chunk.id, {
        ...existing,
        score: existing.score + normalizedScore * 0.3,
        source: 'hybrid',
      });
    } else {
      resultMap.set(result.chunk.id, {
        ...result,
        score: normalizedScore * 0.3,
        source: 'keyword',
      });
    }
  }
  
  const boostedResults = Array.from(resultMap.values()).map(result => {
    let recencyBoost = 0;
    if (result.document.publishedAt) {
      const ageInDays = (Date.now() - result.document.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      recencyBoost = Math.max(0, 1 - (ageInDays / 365)) * 0.1;
    }
    
    let statusBoost = 0;
    if (result.document.status === 'active') {
      statusBoost = 0.05;
    }
    
    return {
      ...result,
      score: result.score + recencyBoost + statusBoost,
    };
  });
  
  return boostedResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function retrieveContext(
  query: string,
  filters?: RetrievalFilters,
  topK: number = 10
): Promise<{
  context: string;
  sources: Array<{
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
}> {
  const results = await hybridSearch(query, filters, topK);
  
  const contextParts: string[] = [];
  const sources: Array<{
    documentId: number;
    documentTitle: string;
    originalFilename?: string;
    chunkId: number;
    sectionRef?: string;
    url?: string;
    score: number;
    text: string;
    regulator: string;
  }> = [];
  
  for (const result of results) {
    const sectionHeader = result.chunk.sectionRef 
      ? `[Document: ${result.document.title}, Section: ${result.chunk.sectionRef}]\n` 
      : `[Document: ${result.document.title}]\n`;
    
    contextParts.push(sectionHeader + result.chunk.text);
    
    sources.push({
      documentId: result.document.id,
      documentTitle: result.document.title,
      originalFilename: result.document.originalFilename || undefined,
      chunkId: result.chunk.id,
      sectionRef: result.chunk.sectionRef || undefined,
      url: result.document.url || undefined,
      score: result.score,
      text: result.chunk.text.substring(0, 300),
      regulator: result.document.regulator,
    });
  }
  
  return {
    context: contextParts.join('\n\n---\n\n'),
    sources,
  };
}
