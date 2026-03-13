import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import pdfParse from 'pdf-parse';
import { parsePDFWithMistralOCR, parseImageWithMistralOCR, isMistralOcrAvailable } from './mistralOcr';

export interface ParsedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    title?: string;
    author?: string;
    subject?: string;
    tables?: string[];
    [key: string]: any;
  };
  hash: string;
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid PDF buffer');
    }

    // Try Mistral OCR first if available (superior quality for regulatory documents)
    if (isMistralOcrAvailable()) {
      try {
        console.log('Using Mistral OCR 3 for PDF extraction (primary method)...');
        const mistralResult = await parsePDFWithMistralOCR(buffer);
        return {
          text: mistralResult.text,
          metadata: {
            pageCount: mistralResult.pageCount,
            tables: mistralResult.tables,
            ...mistralResult.metadata
          },
          hash: mistralResult.hash
        };
      } catch (mistralError) {
        const errorMsg = mistralError instanceof Error ? mistralError.message : String(mistralError);
        console.warn('Mistral OCR failed, falling back to pdf-parse:', errorMsg);
      }
    }

    // Fallback to pdf-parse
    console.log('Extracting text from PDF using pdf-parse (fallback)...');
    
    const pdfData = await pdfParse(buffer);
    
    const text = pdfData.text?.trim() || '';
    const pageCount = pdfData.numpages || 0;
    
    if (!text || text.length < 50) {
      console.log('pdf-parse extracted minimal text, trying OpenAI Vision OCR...');
      return await parsePDFWithOpenAIVision(buffer);
    }
    
    const hash = createHash('sha256').update(buffer).digest('hex');
    
    console.log(`Successfully extracted ${text.length} characters from ${pageCount} pages`);
    
    return {
      text,
      metadata: {
        pageCount,
        title: pdfData.info?.Title || undefined,
        author: pdfData.info?.Author || undefined,
        subject: pdfData.info?.Subject || undefined,
        creator: pdfData.info?.Creator || undefined,
        producer: pdfData.info?.Producer || undefined,
        extractionMethod: 'pdf-parse'
      },
      hash,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('PDF parsing with pdf-parse failed:', errorMsg);
    console.log('Falling back to OpenAI Vision OCR...');
    return await parsePDFWithOpenAIVision(buffer);
  }
}

async function parsePDFWithOpenAIVision(buffer: Buffer): Promise<ParsedDocument> {
  try {
    console.log('Converting PDF to images for OCR text extraction...');
    const pdf2pic = await import('pdf2pic');
    
    const convert = pdf2pic.fromBuffer(buffer, {
      density: 200,
      saveFilename: "page",
      savePath: "/tmp",
      format: "png",
      width: 1600,
      height: 2000
    });
    
    let allText = '';
    let pageCount = 0;
    const maxPages = 20;
    
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const result = await convert(pageNum, { responseType: "base64" });
        if (!result.base64) break;
        
        console.log(`OCR extracting text from page ${pageNum}...`);
        
        const response = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are an OCR system. Extract ALL text from this document page exactly as it appears. 
Include every word, number, heading, paragraph, table cell, and footer.
Preserve the document structure with line breaks.
Do NOT summarize or interpret - just extract the raw text.
If the page contains a table, format it with | separators.
Start extracting now:`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${result.base64}`,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0,
        });
        
        const pageText = response.choices[0].message.content || '';
        if (pageText.trim() && pageText.length > 20) {
          allText += `\n${pageText}\n`;
          pageCount++;
        }
        
      } catch (pageError) {
        console.log(`Failed to OCR page ${pageNum}:`, pageError instanceof Error ? pageError.message : String(pageError));
        break;
      }
    }
    
    if (!allText.trim()) {
      throw new Error('Could not extract text from PDF using OCR');
    }
    
    const hash = createHash('sha256').update(buffer).digest('hex');
    
    return {
      text: allText.trim(),
      metadata: {
        pageCount,
        extractionMethod: 'openai-vision-ocr'
      },
      hash,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('PDF OCR parsing error:', errorMsg);
    throw new Error(`Failed to parse PDF: ${errorMsg}`);
  }
}

export async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    const hash = createHash('sha256').update(buffer).digest('hex');
    
    return {
      text: result.value.trim(),
      metadata: {
        messages: result.messages,
      },
      hash,
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function parseHTML(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const html = buffer.toString('utf-8');
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer, aside').remove();
    
    const title = $('title').text() || $('h1').first().text() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    const bodyText = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
    
    const hash = createHash('sha256').update(buffer).digest('hex');
    
    return {
      text: bodyText,
      metadata: {
        title,
        description: metaDescription,
      },
      hash,
    };
  } catch (error) {
    throw new Error(`Failed to parse HTML: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function parseImage(buffer: Buffer, mimeType: string): Promise<ParsedDocument> {
  const hash = createHash('sha256').update(buffer).digest('hex');
  
  if (isMistralOcrAvailable()) {
    try {
      console.log('Using Mistral OCR 3 for image text extraction...');
      const mistralResult = await parseImageWithMistralOCR(buffer, mimeType);
      return {
        text: mistralResult.text,
        metadata: {
          pageCount: mistralResult.pageCount,
          tables: mistralResult.tables,
          ...mistralResult.metadata
        },
        hash: mistralResult.hash
      };
    } catch (mistralError) {
      const errorMsg = mistralError instanceof Error ? mistralError.message : String(mistralError);
      console.warn('Mistral OCR for image failed, trying OpenAI Vision fallback:', errorMsg);
      
      // Fallback to OpenAI Vision for image OCR
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const base64Image = buffer.toString('base64');
        const mediaType = mimeType.includes('png') ? 'image/png' : 
                          mimeType.includes('gif') ? 'image/gif' :
                          mimeType.includes('webp') ? 'image/webp' : 'image/jpeg';
        
        const response = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are an OCR system. Extract ALL text from this image exactly as it appears. 
Include every word, number, heading, and paragraph.
Preserve the document structure with line breaks.
If the image contains a table, format it with | separators.
Do NOT summarize or interpret - just extract the raw text.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${base64Image}`,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0,
        });
        
        const text = response.choices[0].message.content || '';
        console.log(`OpenAI Vision extracted ${text.length} characters from image`);
        
        return {
          text: text.trim(),
          metadata: {
            pageCount: 1,
            extractionMethod: 'openai-vision-ocr'
          },
          hash
        };
      } catch (openaiError) {
        const openaiMsg = openaiError instanceof Error ? openaiError.message : String(openaiError);
        console.error('OpenAI Vision fallback also failed:', openaiMsg);
        throw new Error(`Failed to extract text from image: ${errorMsg}. Fallback also failed: ${openaiMsg}`);
      }
    }
  }
  
  // If no Mistral key, try OpenAI Vision directly
  if (process.env.OPENAI_API_KEY) {
    console.log('Mistral OCR not available, using OpenAI Vision for image OCR...');
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const base64Image = buffer.toString('base64');
      const mediaType = mimeType.includes('png') ? 'image/png' : 
                        mimeType.includes('gif') ? 'image/gif' :
                        mimeType.includes('webp') ? 'image/webp' : 'image/jpeg';
      
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an OCR system. Extract ALL text from this image exactly as it appears.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0,
      });
      
      const text = response.choices[0].message.content || '';
      
      return {
        text: text.trim(),
        metadata: {
          pageCount: 1,
          extractionMethod: 'openai-vision-ocr'
        },
        hash
      };
    } catch (error) {
      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  throw new Error('Image OCR requires either MISTRAL_API_KEY or OPENAI_API_KEY to be configured.');
}

export async function parseDocument(
  buffer: Buffer, 
  mimeType: string
): Promise<ParsedDocument> {
  const normalizedMimeType = mimeType.toLowerCase();
  
  if (normalizedMimeType.includes('pdf')) {
    return parsePDF(buffer);
  } else if (
    normalizedMimeType.includes('wordprocessingml') || 
    normalizedMimeType.includes('msword') ||
    normalizedMimeType.includes('docx')
  ) {
    return parseDOCX(buffer);
  } else if (normalizedMimeType.includes('html')) {
    return parseHTML(buffer);
  } else if (
    normalizedMimeType.includes('image/') ||
    normalizedMimeType.includes('png') ||
    normalizedMimeType.includes('jpeg') ||
    normalizedMimeType.includes('jpg') ||
    normalizedMimeType.includes('gif') ||
    normalizedMimeType.includes('webp')
  ) {
    return parseImage(buffer, mimeType);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

export function extractMetadata(text: string): {
  sections: string[];
  tables: string[];
  references: string[];
} {
  const lines = text.split('\n');
  const sections: string[] = [];
  const tables: string[] = [];
  const references: string[] = [];
  
  let currentSection = '';
  const sectionPattern = /^(?:\d+\.?)+\s+[A-Z]/;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (sectionPattern.test(trimmedLine)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = trimmedLine;
    }
    
    if (trimmedLine.includes('┃') || trimmedLine.includes('│') || 
        (trimmedLine.match(/\s{2,}/g)?.length || 0) > 3) {
      tables.push(trimmedLine);
    }
    
    if (trimmedLine.match(/^\[\d+\]/) || 
        trimmedLine.toLowerCase().startsWith('ref:') ||
        trimmedLine.toLowerCase().includes('see section')) {
      references.push(trimmedLine);
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return {
    sections: sections.filter(s => s.length > 0),
    tables: tables.filter(t => t.length > 0),
    references: references.filter(r => r.length > 0),
  };
}
