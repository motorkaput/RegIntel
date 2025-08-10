import OpenAI from "openai";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DocumentAnalysis {
  text: string;
  sentiment: {
    label: string;
    score: number;
    reasoning: string;
  };
  classification: string;
  keywords: string[];
  insights: string[];
  riskFlags: string[];
  summary: string;
  wordCloud: Array<{ text: string; value: number; }>;
  score: number;
  wordCount: number;
  emotionalTone: string[];
  keyPhrases: string[];
}

export interface ContextAnalysis {
  context: string;
  mentions: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emotionalTone: string[];
  keyPhrases: string[];
  summary: string;
}

export interface QuestionAnswer {
  answer: string;
  confidence: number;
  sources: string[];
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
        // Enhanced PDF processing: Convert PDF to images first, then use Vision API
        try {
          console.log('Processing PDF: Converting to images first...');
          const pdf2pic = await import('pdf2pic');
          
          // Convert PDF to base64 images
          const convert = pdf2pic.fromBuffer(buffer, {
            density: 200,           // Higher quality
            saveFilename: "page",
            savePath: "/tmp",
            format: "png",
            width: 2000,
            height: 2000
          });
          
          let allText = '';
          let pageCount = 0;
          
          // Convert all pages (up to 10 pages to avoid token limits)
          for (let pageNum = 1; pageNum <= 10; pageNum++) {
            try {
              const result = await convert(pageNum, { responseType: "base64" });
              if (!result.base64) break; // No more pages
              
              pageCount++;
              console.log(`Processing PDF page ${pageNum}...`);
              
              const response = await openai.chat.completions.create({
                model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: `Extract all readable text from this PDF page ${pageNum}. Be thorough - include all text content regardless of font size, formatting, or position. Preserve document structure and include any text in headers, footers, sidebars, tables, or captions.`
                      },
                      {
                        type: "image_url",
                        image_url: {
                          url: `data:image/png;base64,${result.base64}`
                        }
                      }
                    ]
                  }
                ],
                max_tokens: 1500,
                temperature: 0.1,
              });
              
              const pageText = response.choices[0].message.content || '';
              if (pageText.trim() && pageText.length > 20) {
                allText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
              }
              
            } catch (pageError) {
              console.log(`No more pages or error on page ${pageNum}:`, pageError);
              break; // No more pages or error
            }
          }
          
          console.log(`PDF processing completed. Total pages: ${pageCount}, Text length: ${allText.length}`);
          console.log('PDF content preview:', allText.substring(0, 300) + '...');
          
          if (allText.trim() && allText.length > 50) {
            return allText;
          } else {
            return `PDF conversion completed but no readable text found. The PDF may contain only images or non-text content. Pages processed: ${pageCount}`;
          }
          
        } catch (error) {
          console.error('PDF processing error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          return `PDF processing failed: ${(error as any)?.message || 'Unknown error occurred'}. Please try a different PDF file.`;
        }
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // Extract real text from DOCX files using mammoth.js
        try {
          const result = await mammoth.extractRawText({ buffer });
          const extractedText = result.value.trim();
          
          if (extractedText && extractedText.length > 10) {
            return extractedText;
          } else {
            return `DOCX document appears to be empty or contains primarily formatting. Raw content length: ${extractedText.length} characters.`;
          }
        } catch (error) {
          console.error('DOCX extraction error:', error);
          return `ERROR: Failed to extract text from DOCX document: ${(error as Error).message}`;
        }
      
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        // Process PPTX using JSZip and XML parsing (mimicking Python's pptx library approach)
        try {
          console.log('Processing PPTX with comprehensive XML parsing...');
          const JSZip = await import('jszip');
          const zip = new JSZip.default();
          
          // Load PPTX as ZIP file
          const archive = await zip.loadAsync(buffer);
          
          let extractedText = '';
          let slideCount = 0;
          
          // Find all slide files and sort them properly
          const slideFiles = Object.keys(archive.files)
            .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
            .sort((a, b) => {
              const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
              const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
              return numA - numB;
            });
          
          for (const slideFile of slideFiles) {
            slideCount++;
            const slideXml = await archive.files[slideFile].async('text');
            
            // Enhanced text extraction with multiple patterns
            const patterns = [
              /<a:t[^>]*>([^<]*)<\/a:t>/g,
              /<a:t>([^<]*)<\/a:t>/g,
              /<p:txBody[^>]*>.*?<\/p:txBody>/g
            ];
            
            let slideTexts: string[] = [];
            
            // Try each pattern to extract maximum text
            for (const pattern of patterns) {
              const matches = slideXml.match(pattern) || [];
              const texts = matches.map(match => {
                // Clean up XML tags and decode entities
                let text = match.replace(/<[^>]*>/g, '').trim();
                text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                return text;
              }).filter(text => text.length > 0);
              
              slideTexts = slideTexts.concat(texts);
            }
            
            // Remove duplicates and empty strings
            slideTexts = Array.from(new Set(slideTexts)).filter(text => text.trim().length > 0);
            
            if (slideTexts.length > 0) {
              extractedText += `\n--- Slide ${slideCount} ---\n`;
              slideTexts.forEach(text => {
                if (text.trim()) {
                  extractedText += `${text.trim()}\n`;
                }
              });
              extractedText += '\n';
            }
          }
          
          console.log(`PPTX processing completed. Found ${slideCount} slides, text length: ${extractedText.length}`);
          console.log('PPTX content preview:', extractedText.substring(0, 300) + '...');
          
          if (extractedText.trim() && extractedText.length > 30) {
            return extractedText.trim();
          } else {
            return `This PPTX presentation contains ${slideCount} slides but appears to have primarily visual content with minimal extractable text.`;
          }
        } catch (error) {
          console.error('PPTX processing error:', error);
          return `This PPTX presentation could not be processed for text extraction. The file structure may be incompatible or corrupted.`;
        }
      
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        // Extract real text from Excel files (.xlsx) using xlsx library
        try {
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          let extractedText = '';
          
          // Process all sheets
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_csv(worksheet);
            if (sheetData.trim()) {
              extractedText += `Sheet: ${sheetName}\n${sheetData}\n\n`;
            }
          });
          
          if (extractedText.trim()) {
            return extractedText;
          } else {
            return `Excel spreadsheet appears to be empty or contains no readable data.`;
          }
        } catch (error) {
          console.error('Excel extraction error:', error);
          return `ERROR: Failed to extract text from Excel document: ${(error as Error).message}`;
        }
      
      case 'application/vnd.ms-excel':
        // Extract real text from older Excel files (.xls) using xlsx library
        try {
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          let extractedText = '';
          
          // Process all sheets
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_csv(worksheet);
            if (sheetData.trim()) {
              extractedText += `Sheet: ${sheetName}\n${sheetData}\n\n`;
            }
          });
          
          if (extractedText.trim()) {
            return extractedText;
          } else {
            return `Excel workbook appears to be empty or contains no readable data.`;
          }
        } catch (error) {
          console.error('Excel extraction error:', error);
          return `ERROR: Failed to extract text from Excel workbook: ${(error as Error).message}`;
        }
        
      default:
        if (mimeType.startsWith('image/')) {
          // Extract real text from images using OpenAI vision API
          try {
            const base64Image = buffer.toString('base64');
            const imageExtension = mimeType.split('/')[1];
            
            const response = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Extract and transcribe all visible text from this image. Include any charts, graphs, tables, headings, labels, captions, and other textual content. Provide the text in a structured format that preserves the document's organization. If this is a chart or diagram, also describe the visual structure and data relationships."
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${mimeType};base64,${base64Image}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 2000
            });
            
            const extractedText = response.choices[0].message.content;
            return extractedText || 'No text could be extracted from this image.';
          } catch (error) {
            console.error('Image extraction error:', error);
            return `ERROR: Failed to extract text from image: ${(error as Error).message}`;
          }
        }
        console.log(`Unsupported file type: ${mimeType}`);
        return `ERROR: Unsupported file type: ${mimeType}. Please write to hello@darkstreet.org with this bug.`;
    }
  } catch (error) {
    throw new Error(`Failed to extract text: ${(error as Error).message}`);
  }
}

/**
 * Generate word cloud data from text
 */
function generateWordCloud(text: string): Array<{ text: string; value: number; }> {
  // Enhanced stop word list for business documents
  const stopWords = new Set([
    'this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 
    'would', 'there', 'could', 'other', 'document', 'content', 'analysis', 'include', 'includes', 'including',
    'these', 'those', 'such', 'more', 'also', 'well', 'most', 'some', 'many', 'much', 'very', 'into', 'over',
    'should', 'than', 'through', 'while', 'where', 'when', 'what', 'who', 'how', 'why', 'can', 'may', 'might',
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'had', 'her', 'was', 'one', 'our', 'out',
    'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
    'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
  ]);

  // Extract words with better filtering for business terms
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word)) // Remove pure numbers
    .filter(word => word.match(/[a-z]/i)); // Must contain at least one letter

  // Count word frequency
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top words and normalize values for better visual representation
  const sortedWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 50);

  // Normalize values to create better size distribution (1-100 scale)
  const maxCount = sortedWords[0]?.[1] || 1;
  const minCount = sortedWords[sortedWords.length - 1]?.[1] || 1;
  
  return sortedWords.map(([text, count]) => {
    // Create logarithmic scaling for better visual distribution
    const normalized = Math.max(1, Math.round(
      20 + (Math.log(count) / Math.log(maxCount)) * 80
    ));
    return { text, value: normalized };
  });
}

/**
 * Analyze document using OpenAI
 */
export async function analyzeDocument(
  documentId: string,
  buffer: Buffer,
  mimeType: string
): Promise<DocumentAnalysis> {
  console.log('=== Starting analyzeDocument ===');
  console.log('Document ID:', documentId);
  console.log('MIME Type:', mimeType);
  console.log('Buffer size:', buffer.length);
  console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
  
  try {
    // Extract text from document
    const extractedText = await extractTextFromFile(buffer, mimeType);
    const wordCount = extractedText.split(/\s+/).length;
    
    console.log('Text extracted successfully. Length:', extractedText.length);
    console.log('Word count:', wordCount);
    console.log('Text preview:', extractedText.substring(0, 200) + '...');

    // Special handling for actual extraction failures only - be more specific
    if (extractedText.includes('could not be processed for text extraction') ||
        extractedText.includes('corrupted') ||
        extractedText.includes('verify the file') ||
        extractedText.includes('structure may be incompatible') ||
        extractedText.includes('PDF processing failed') ||
        extractedText.includes('PDF Vision API Error') ||
        extractedText.includes('PDF conversion completed but no readable text found') ||
        extractedText.startsWith('ERROR:')) {
      return {
        text: extractedText,
        sentiment: { label: 'neutral', score: 0.5, reasoning: 'Document extraction failed' },
        classification: 'Undeterminable',
        keywords: [],
        insights: [],
        riskFlags: [],
        summary: extractedText,
        wordCloud: [],
        score: 0,
        wordCount: 0,
        emotionalTone: [],
        keyPhrases: []
      };
    }

    // Use OpenAI for comprehensive analysis
    const analysisPrompt = `
You are an expert document analyst with deep expertise in business intelligence, financial analysis, strategic planning, and risk assessment. Analyze this document with exceptional depth and precision.

DOCUMENT CONTENT:
${extractedText}

{
  "sentiment": {
    "label": "positive|negative|neutral|mixed",
    "score": 0.0-1.0,
    "reasoning": "Detailed explanation citing specific language, tone indicators, and contextual elements from the document"
  },
  "classification": "broad_category_from_list_above",
  "keywords": ["10-15 most significant domain-specific terms from the document"],
  "insights": ["3-5 deep analytical insights showing understanding of strategic implications and business context"],
  "riskFlags": ["specific risks, challenges, or concerns identified in the document content"],
  "summary": "comprehensive 4-6 sentence summary demonstrating deep understanding of purpose, findings, and business context",
  "emotionalTone": ["2-4 specific emotional descriptors capturing the document's communication style"],
  "keyPhrases": ["5-8 important phrases directly quoted from the document"]
}

CLASSIFICATION CATEGORIES (choose ONE broad category):
- Strategy
- Financial
- Marketing
- Legal
- Operations
- Business
- Technical
- HR

ANALYSIS REQUIREMENTS:
- Extract specific business metrics, financial figures, percentages mentioned
- Identify strategic objectives, initiatives, recommendations
- Recognize industry terminology and business processes
- Assess competitive positioning and market dynamics
- Identify stakeholder concerns and implementation challenges
- Understand intended audience and business context
- Recognize timeframes, deadlines, historical comparisons

QUALITY STANDARDS:
- Insights must reflect sophisticated business understanding
- Keywords should include domain-specific terminology
- Summary must demonstrate strategic business comprehension
- Classification must be ONE of the 8 broad categories listed above
- Base all analysis on actual document content, not assumptions`;

    console.log('Sending request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert document analyst specializing in business intelligence, sentiment analysis, and risk assessment. Provide detailed, accurate analysis in the requested JSON format."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    console.log('OpenAI response received successfully');
    console.log('Response content preview:', response.choices[0].message.content?.substring(0, 200) + '...');

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    console.log('Analysis parsed successfully:', Object.keys(analysis));

    // Generate word cloud
    const wordCloud = generateWordCloud(extractedText);

    // Calculate overall score based on sentiment and content quality
    const score = Math.min(0.95, Math.max(0.1, 
      (analysis.sentiment.score * 0.4) + 
      (analysis.keywords.length / 10 * 0.3) + 
      (analysis.insights.length / 5 * 0.3)
    ));

    return {
      text: extractedText,
      sentiment: analysis.sentiment,
      classification: analysis.classification,
      keywords: analysis.keywords,
      insights: analysis.insights,
      riskFlags: analysis.riskFlags,
      summary: analysis.summary,
      wordCloud,
      score,
      wordCount,
      emotionalTone: analysis.emotionalTone,
      keyPhrases: analysis.keyPhrases,
    };

  } catch (error) {
    console.error('Error analyzing document with OpenAI:', error);
    console.error('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.error('Error details:', {
      message: (error as any).message,
      name: (error as any).name,
      status: (error as any).status,
      code: (error as any).code
    });
    
    // Fallback analysis if OpenAI fails
    const extractedText = await extractTextFromFile(buffer, mimeType);
    const wordCount = extractedText.split(/\s+/).length;
    
    return {
      text: extractedText,
      sentiment: {
        label: 'neutral',
        score: 0.5,
        reasoning: 'Fallback analysis due to API error'
      },
      classification: 'Business',
      keywords: ['business', 'analysis', 'document', 'content'],
      insights: ['Document processed with fallback analysis'],
      riskFlags: ['API analysis unavailable'],
      summary: extractedText.substring(0, 200) + '...',
      wordCloud: generateWordCloud(extractedText),
      score: 0.5,
      wordCount,
      emotionalTone: ['neutral'],
      keyPhrases: ['document analysis'],
    };
  }
}

/**
 * Answer questions based on document collection
 */
export async function answerQuestion(
  documents: Array<{ text: string; filename: string }>,
  question: string
): Promise<QuestionAnswer> {
  try {
    const combinedText = documents.map(doc => 
      `Document: ${doc.filename}\n${doc.text.substring(0, 2000)}`
    ).join('\n\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert document analyst. Answer questions based strictly on the provided documents. If information is not available in the documents, say so clearly. Provide confidence scores based on how well the documents support your answer. IMPORTANT: Use only plain text in your responses - no markdown formatting, no asterisks, no bold text, no special characters like em-dashes or en-dashes. Use simple, clear language without any markdown or formatting symbols."
        },
        {
          role: "user",
          content: `Documents:\n${combinedText}\n\nQuestion: ${question}\n\nProvide your response in JSON format:\n{\n  "answer": "your detailed answer",\n  "confidence": 0.0-1.0,\n  "sources": ["list of relevant document names"]\n}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      answer: result.answer || 'Unable to answer based on provided documents.',
      confidence: result.confidence || 0.0,
      sources: result.sources || [],
    };

  } catch (error) {
    console.error('Error answering question:', error);
    return {
      answer: 'I cannot answer this question based on the provided documents.',
      confidence: 0.0,
      sources: [],
    };
  }
}

/**
 * Perform context-based sentiment analysis
 */
export async function analyzeContext(
  documents: Array<{ text: string; filename: string }>,
  context: string
): Promise<ContextAnalysis> {
  try {
    const combinedText = documents.map(doc => 
      `Document: ${doc.filename}\n${doc.text}`
    ).join('\n\n---\n\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst specializing in contextual sentiment analysis, strategic assessment, and document intelligence. Provide nuanced analysis that captures subtle business implications and stakeholder perspectives. IMPORTANT: Use only plain text in all responses - no markdown formatting, no asterisks, no bold text, no special characters like em-dashes or en-dashes. Write in clear, simple language without any markdown or formatting symbols."
        },
        {
          role: "user",
          content: `
CONTEXT ANALYSIS REQUEST: "${context}"

DOCUMENT COLLECTION:
${combinedText}

ANALYSIS INSTRUCTIONS:
Perform deep contextual analysis to understand how "${context}" appears across these documents. Look for:
- Direct mentions and indirect references
- Sentiment patterns and emotional undertones  
- Strategic implications and business impact
- Stakeholder perspectives and concerns
- Competitive positioning and market dynamics
- Risk factors and opportunity indicators

Provide analysis in this exact JSON format:
{
  "mentions": actual_count_of_context_references,
  "sentimentBreakdown": {
    "positive": percentage_0_to_100,
    "negative": percentage_0_to_100,
    "neutral": percentage_0_to_100
  },
  "emotionalTone": ["specific emotional descriptors reflecting business sentiment"],
  "keyPhrases": ["exact phrases from documents mentioning or relating to the context"],
  "summary": "comprehensive analysis of how this context appears across documents, including strategic implications, stakeholder perspectives, and business impact assessment"
}

QUALITY REQUIREMENTS:
- Count actual mentions, not estimated ranges
- Provide precise sentiment percentages that sum to 100
- Include domain-specific emotional tone descriptors
- Quote exact key phrases from the documents
- Write a sophisticated summary showing deep business understanding
- Focus on strategic and operational implications of the context
`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      context,
      mentions: result.mentions || 0,
      sentimentBreakdown: result.sentimentBreakdown || { positive: 0, negative: 0, neutral: 100 },
      emotionalTone: result.emotionalTone || ['neutral'],
      keyPhrases: result.keyPhrases || [],
      summary: result.summary || `No specific mentions of "${context}" found in the documents.`,
    };

  } catch (error) {
    console.error('Error analyzing context:', error);
    return {
      context,
      mentions: 0,
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 100 },
      emotionalTone: ['neutral'],
      keyPhrases: [],
      summary: `Context analysis unavailable for "${context}".`,
    };
  }
}

/**
 * Main processing function for document analysis
 */
export async function processDocument(
  documentId: string,
  buffer: Buffer,
  mimeType: string
): Promise<DocumentAnalysis> {
  return await analyzeDocument(documentId, buffer, mimeType);
}

/**
 * Process document with AI analysis (alternative function name for compatibility)
 */
export async function processDocumentWithAI(
  buffer: Buffer,
  mimeType: string
): Promise<{
  extractedText: string;
  classification: string;
  sentiment: any;
  keywords: string[];
  insights: string[];
  riskFlags: string[];
  summary: string;
  wordCloud: Array<{ text: string; value: number; }>;
}> {
  console.log('Starting OpenAI document processing for type:', mimeType);
  console.log('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY);
  const analysis = await analyzeDocument('temp', buffer, mimeType);
  return {
    extractedText: analysis.text,
    classification: analysis.classification,
    sentiment: analysis.sentiment,
    keywords: analysis.keywords,
    insights: analysis.insights,
    riskFlags: analysis.riskFlags,
    summary: analysis.summary,
    wordCloud: analysis.wordCloud,
  };
}