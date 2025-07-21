/**
 * Fetch Patterns AI Service
 * Provides document analysis using OpenAI API for sentiment, classification, keywords, and insights
 */

interface DocumentAnalysisResult {
  extractedText: string;
  classification: string;
  sentiment: {
    label: string;
    score: number;
    reasoning: string;
  };
  keywords: string[];
  insights: string[];
  riskFlags: string[];
  summary: string;
  wordCloud: Array<{ text: string; value: number; }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Extract text content from various file formats
 */
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'text/plain':
        return buffer.toString('utf-8');
      
      case 'application/pdf':
        // For now, return placeholder - in production you'd use pdf-parse or similar
        return "PDF text extraction would be implemented here using libraries like pdf-parse";
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For now, return placeholder - in production you'd use mammoth or similar
        return "DOCX text extraction would be implemented here using libraries like mammoth";
      
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        // For now, return placeholder - in production you'd use specific PPTX parsers
        return "PPTX text extraction would be implemented here";
      
      default:
        if (mimeType.startsWith('image/')) {
          return "Image OCR text extraction would be implemented here using libraries like tesseract.js";
        }
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text: ${(error as Error).message}`);
  }
}

/**
 * Generate word cloud data from text
 */
function generateWordCloud(text: string): Array<{ text: string; value: number; }> {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word));

  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([text, value]) => ({ text, value }));
}

/**
 * Analyze document content using simulated AI processing
 */
export async function processDocumentWithAI(buffer: Buffer, mimeType: string): Promise<DocumentAnalysisResult> {
  const extractedText = await extractTextFromFile(buffer, mimeType);
  
  // For demonstration purposes, we'll provide simulated analysis
  // In production, this would call OpenAI API with the extracted text
  
  const textLength = extractedText.length;
  const wordCount = extractedText.split(/\s+/).length;
  
  // Simulated classification based on content characteristics
  let classification = "General Document";
  if (extractedText.toLowerCase().includes("contract") || extractedText.toLowerCase().includes("agreement")) {
    classification = "Legal Document";
  } else if (extractedText.toLowerCase().includes("financial") || extractedText.toLowerCase().includes("budget")) {
    classification = "Financial Document";
  } else if (extractedText.toLowerCase().includes("research") || extractedText.toLowerCase().includes("study")) {
    classification = "Research Document";
  } else if (extractedText.toLowerCase().includes("report") || extractedText.toLowerCase().includes("analysis")) {
    classification = "Business Report";
  }

  // Simulated sentiment analysis
  const positiveWords = extractedText.toLowerCase().match(/\b(good|great|excellent|positive|success|achieve|growth|benefit)\b/g)?.length || 0;
  const negativeWords = extractedText.toLowerCase().match(/\b(bad|poor|negative|problem|issue|concern|risk|decline)\b/g)?.length || 0;
  
  let sentimentLabel = "neutral";
  let sentimentScore = 0.5;
  
  if (positiveWords > negativeWords) {
    sentimentLabel = "positive";
    sentimentScore = Math.min(0.7 + (positiveWords - negativeWords) * 0.1, 1.0);
  } else if (negativeWords > positiveWords) {
    sentimentLabel = "negative";
    sentimentScore = Math.max(0.3 - (negativeWords - positiveWords) * 0.1, 0.0);
  }

  // Simulated keyword extraction
  const keywords = generateWordCloud(extractedText)
    .slice(0, 8)
    .map(item => item.text);

  // Simulated insights
  const insights = [
    `Document contains ${wordCount} words across ${textLength} characters`,
    `Primary classification: ${classification}`,
    `Sentiment analysis shows ${sentimentLabel} tone`,
    `Key topics identified: ${keywords.slice(0, 3).join(", ")}`
  ];

  // Simulated risk flags
  const riskFlags: string[] = [];
  if (extractedText.toLowerCase().includes("confidential") || extractedText.toLowerCase().includes("sensitive")) {
    riskFlags.push("Contains confidential information");
  }
  if (extractedText.toLowerCase().includes("deadline") || extractedText.toLowerCase().includes("urgent")) {
    riskFlags.push("Time-sensitive content identified");
  }
  if (negativeWords > 5) {
    riskFlags.push("High negative sentiment detected");
  }

  // Simulated summary
  const summary = `This ${classification.toLowerCase()} exhibits ${sentimentLabel} sentiment and covers topics related to ${keywords.slice(0, 2).join(" and ")}. The document contains ${wordCount} words and has been classified based on its content structure and key terminology.`;

  return {
    extractedText,
    classification,
    sentiment: {
      label: sentimentLabel,
      score: sentimentScore,
      reasoning: `Analysis based on ${positiveWords} positive and ${negativeWords} negative indicators`
    },
    keywords,
    insights,
    riskFlags,
    summary,
    wordCloud: generateWordCloud(extractedText)
  };
}

/**
 * Real OpenAI API integration (requires OPENAI_API_KEY)
 * This function would be used when OpenAI API key is available
 */
export async function processDocumentWithOpenAI(text: string): Promise<Partial<DocumentAnalysisResult>> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert document analyst. Analyze the provided text and return a JSON response with classification, sentiment (label, score, reasoning), keywords array, insights array, riskFlags array, and summary.'
          },
          {
            role: 'user',
            content: `Analyze this document text: ${text.substring(0, 4000)}...` // Limit text length for API
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: OpenAIResponse = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return {
      classification: analysis.classification,
      sentiment: analysis.sentiment,
      keywords: analysis.keywords,
      insights: analysis.insights,
      riskFlags: analysis.riskFlags,
      summary: analysis.summary
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI analysis failed: ${(error as Error).message}`);
  }
}