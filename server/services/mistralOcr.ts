import { createHash } from 'crypto';

export interface MistralOcrResult {
  text: string;
  tables: string[];
  pageCount: number;
  metadata: {
    extractionMethod: string;
    model: string;
    [key: string]: any;
  };
  hash: string;
}

interface MistralOcrPage {
  index: number;
  markdown: string;
  images?: Array<{
    id: string;
    top_left_x: number;
    top_left_y: number;
    bottom_right_x: number;
    bottom_right_y: number;
    image_base64?: string;
  }>;
  dimensions?: {
    dpi: number;
    height: number;
    width: number;
  };
}

interface MistralOcrResponse {
  pages: MistralOcrPage[];
  model: string;
  usage_info?: {
    pages_processed: number;
    doc_size_bytes: number;
  };
}

export async function parsePDFWithMistralOCR(buffer: Buffer): Promise<MistralOcrResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  console.log('Processing PDF with Mistral OCR 3...');
  
  const base64Document = buffer.toString('base64');
  
  const requestBody = {
    model: 'mistral-ocr-latest',
    document: {
      type: 'document_url',
      document_url: `data:application/pdf;base64,${base64Document}`
    },
    include_image_base64: false,
    table_format: 'html'
  };

  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mistral OCR API error:', response.status, errorText);
    throw new Error(`Mistral OCR API error: ${response.status} - ${errorText}`);
  }

  const result: MistralOcrResponse = await response.json();
  
  if (!result.pages || result.pages.length === 0) {
    throw new Error('Mistral OCR returned no pages');
  }

  let allText = '';
  const tables: string[] = [];
  
  for (const page of result.pages) {
    const markdown = page.markdown || '';
    allText += markdown + '\n\n';
    
    const tableMatches = markdown.match(/<table[\s\S]*?<\/table>/gi);
    if (tableMatches) {
      tables.push(...tableMatches);
    }
  }

  allText = allText.trim();
  
  if (!allText || allText.length < 50) {
    throw new Error('Mistral OCR extracted insufficient text');
  }

  const hash = createHash('sha256').update(buffer).digest('hex');
  
  console.log(`Mistral OCR extracted ${allText.length} characters from ${result.pages.length} pages`);
  if (tables.length > 0) {
    console.log(`Found ${tables.length} tables in the document`);
  }

  return {
    text: allText,
    tables,
    pageCount: result.pages.length,
    metadata: {
      extractionMethod: 'mistral-ocr-3',
      model: result.model || 'mistral-ocr-latest',
      pagesProcessed: result.usage_info?.pages_processed,
      docSizeBytes: result.usage_info?.doc_size_bytes
    },
    hash
  };
}

export async function parseImageWithMistralOCR(buffer: Buffer, mimeType: string): Promise<MistralOcrResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  console.log(`Processing image (${mimeType}) with Mistral OCR 3...`);
  
  const base64Image = buffer.toString('base64');
  const mediaType = mimeType.includes('png') ? 'image/png' : 
                    mimeType.includes('gif') ? 'image/gif' :
                    mimeType.includes('webp') ? 'image/webp' : 'image/jpeg';
  
  const requestBody = {
    model: 'mistral-ocr-latest',
    document: {
      type: 'image_url',
      image_url: `data:${mediaType};base64,${base64Image}`
    },
    include_image_base64: false,
    table_format: 'html'
  };

  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mistral OCR API error:', response.status, errorText);
    throw new Error(`Mistral OCR API error: ${response.status} - ${errorText}`);
  }

  const result: MistralOcrResponse = await response.json();
  
  if (!result.pages || result.pages.length === 0) {
    throw new Error('Mistral OCR returned no pages');
  }

  let allText = '';
  const tables: string[] = [];
  
  for (const page of result.pages) {
    const markdown = page.markdown || '';
    allText += markdown + '\n\n';
    
    const tableMatches = markdown.match(/<table[\s\S]*?<\/table>/gi);
    if (tableMatches) {
      tables.push(...tableMatches);
    }
  }

  allText = allText.trim();
  
  const hash = createHash('sha256').update(buffer).digest('hex');
  
  console.log(`Mistral OCR extracted ${allText.length} characters from image (${result.pages.length} page(s))`);

  return {
    text: allText,
    tables,
    pageCount: result.pages.length,
    metadata: {
      extractionMethod: 'mistral-ocr-3',
      model: result.model || 'mistral-ocr-latest'
    },
    hash
  };
}

export function isMistralOcrAvailable(): boolean {
  return !!process.env.MISTRAL_API_KEY;
}
