import { storage } from "../storage";

interface DocumentAnalysis {
  text: string;
  insights: any;
  sentiment: string;
  score: number;
}

export async function processDocument(
  documentId: number,
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentAnalysis> {
  try {
    // Simulate document processing with AI
    const text = await extractTextFromBuffer(fileBuffer, mimeType);
    const insights = await analyzeDocument(text);
    const sentiment = await analyzeSentiment(text);
    const score = await calculateQualityScore(text, insights);

    // Record processing time metric
    await storage.createPerformanceMetric({
      userId: (await storage.getDocument(documentId))?.userId || "",
      metricType: 'processing_time',
      value: Math.random() * 5 + 1, // Simulate processing time 1-6 seconds
      metadata: { documentId },
    });

    return {
      text,
      insights,
      sentiment,
      score,
    };
  } catch (error) {
    console.error("Error processing document:", error);
    throw new Error("Failed to process document");
  }
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  // Simulate OCR and text extraction
  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }
  
  // For other formats, simulate extraction
  const sampleTexts = [
    "This is a sample document containing important business information about quarterly performance and strategic initiatives.",
    "Financial report showing revenue growth of 15% year-over-year with strong performance in key market segments.",
    "Technical documentation covering system architecture, API specifications, and implementation guidelines.",
    "Legal contract outlining terms and conditions for service agreement between parties.",
    "Marketing analysis report detailing customer segmentation and campaign performance metrics.",
  ];
  
  return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
}

async function analyzeDocument(text: string): Promise<any> {
  // Simulate AI-powered document analysis
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = Math.round(wordCount / sentenceCount);
  
  const insights = {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    readabilityScore: Math.random() * 100,
    keyTopics: extractKeyTopics(text),
    entities: extractEntities(text),
    summary: generateSummary(text),
  };

  return insights;
}

async function analyzeSentiment(text: string): Promise<string> {
  // Simulate sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'positive', 'growth', 'success', 'achievement'];
  const negativeWords = ['bad', 'poor', 'negative', 'decline', 'failure', 'problem', 'issue'];
  
  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

async function calculateQualityScore(text: string, insights: any): Promise<number> {
  // Simulate quality scoring based on various factors
  let score = 50; // Base score
  
  // Readability factor
  score += (insights.readabilityScore || 0) * 0.3;
  
  // Length factor
  if (insights.wordCount > 100 && insights.wordCount < 2000) {
    score += 20;
  }
  
  // Structure factor
  if (insights.avgWordsPerSentence > 10 && insights.avgWordsPerSentence < 25) {
    score += 15;
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function extractKeyTopics(text: string): string[] {
  // Simulate topic extraction
  const topics = ['business', 'finance', 'technology', 'marketing', 'operations', 'strategy', 'legal', 'compliance'];
  return topics.filter(() => Math.random() > 0.7).slice(0, 3);
}

function extractEntities(text: string): any[] {
  // Simulate named entity recognition
  const entities = [
    { type: 'PERSON', value: 'John Smith', confidence: 0.95 },
    { type: 'ORGANIZATION', value: 'Acme Corp', confidence: 0.89 },
    { type: 'DATE', value: '2024-01-15', confidence: 0.92 },
    { type: 'MONEY', value: '$50,000', confidence: 0.87 },
  ];
  
  return entities.filter(() => Math.random() > 0.6);
}

function generateSummary(text: string): string {
  // Simulate text summarization
  const summaries = [
    "This document outlines key performance indicators and strategic objectives for the upcoming quarter.",
    "The report highlights significant growth opportunities and potential challenges in the current market.",
    "Key findings indicate positive trends in customer engagement and operational efficiency.",
    "The analysis reveals important insights about market dynamics and competitive positioning.",
    "This document provides comprehensive coverage of technical requirements and implementation details.",
  ];
  
  return summaries[Math.floor(Math.random() * summaries.length)];
}
