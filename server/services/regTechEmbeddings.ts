import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TextChunk {
  text: string;
  tokens: number;
  ordinal: number;
  sectionRef?: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkText(
  text: string,
  targetTokens: number = 1000,
  maxTokens: number = 1200,
  minTokens: number = 800
): TextChunk[] {
  const chunks: TextChunk[] = [];
  
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  let currentTokens = 0;
  let ordinal = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    
    if (currentTokens + paragraphTokens > maxTokens && currentChunk.length > 0) {
      if (currentTokens >= minTokens) {
        chunks.push({
          text: currentChunk.trim(),
          tokens: currentTokens,
          ordinal: ordinal++,
        });
        currentChunk = '';
        currentTokens = 0;
      }
    }
    
    if (paragraphTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          tokens: currentTokens,
          ordinal: ordinal++,
        });
        currentChunk = '';
        currentTokens = 0;
      }
      
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);
        
        if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            tokens: currentTokens,
            ordinal: ordinal++,
          });
          currentChunk = '';
          currentTokens = 0;
        }
        
        currentChunk += sentence + ' ';
        currentTokens += sentenceTokens;
      }
    } else {
      currentChunk += paragraph + '\n\n';
      currentTokens += paragraphTokens;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      tokens: currentTokens,
      ordinal: ordinal++,
    });
  }
  
  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      dimensions: 2000,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    if (texts.length === 0) {
      return [];
    }
    
    const MAX_BATCH_SIZE = 100;
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: batch,
        dimensions: 2000,
      });
      
      embeddings.push(...response.data.map(d => d.embedding));
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function embedChunks(chunks: TextChunk[]): Promise<Array<TextChunk & { embedding: number[] }>> {
  const texts = chunks.map(c => c.text);
  const embeddings = await generateEmbeddings(texts);
  
  return chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));
}

export function extractSectionReferences(text: string): string | undefined {
  const sectionPatterns = [
    /^(?:Section|Sec\.|§)\s+(\d+(?:\.\d+)*)/i,
    /^(\d+(?:\.\d+)+)\s+[A-Z]/,
    /^Article\s+(\d+)/i,
    /^Paragraph\s+(\d+)/i,
    /^\(([a-z0-9]+)\)\s+/,
  ];
  
  for (const pattern of sectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return undefined;
}

export async function chunkAndEmbed(
  text: string,
  options?: {
    targetTokens?: number;
    maxTokens?: number;
    minTokens?: number;
  }
): Promise<Array<TextChunk & { embedding: number[] }>> {
  const chunks = chunkText(
    text,
    options?.targetTokens,
    options?.maxTokens,
    options?.minTokens
  );
  
  chunks.forEach(chunk => {
    const sectionRef = extractSectionReferences(chunk.text);
    if (sectionRef) {
      chunk.sectionRef = sectionRef;
    }
  });
  
  return await embedChunks(chunks);
}
