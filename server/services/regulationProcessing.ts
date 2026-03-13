import { db } from '../db';
import { 
  regulations, 
  ocrArtifacts, 
  legalUnits, 
  regulatoryDocuments,
  aiAuditLog,
  segmentationRulePacks
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { segmentRegulation, type SegmentationResult, type ExtractedLegalUnit } from './legalUnitSegmentation';
import { 
  generateId, 
  computeTextHash, 
  getCurrentRulePackVersion,
  serializeRulePackForDb,
  RULE_PACK_V1
} from './segmentationRulePacks';
import crypto from 'crypto';

export interface RegulationMetadata {
  jurisdiction: string;
  regulator: string;
  language: string;
  title: string;
  effectiveDate?: string;
  versionLabel: string;
  sourceUrl?: string;
}

export interface ProcessingResult {
  regulationId: string;
  status: 'success' | 'partial' | 'failed';
  ocrArtifactId?: string;
  segmentationResult?: SegmentationResult;
  legalUnitsCreated: number;
  errors: string[];
  processingTimeMs: number;
}

export async function ensureRulePackExists(): Promise<void> {
  const existing = await db.select()
    .from(segmentationRulePacks)
    .where(eq(segmentationRulePacks.version, RULE_PACK_V1.version))
    .limit(1);
  
  if (existing.length === 0) {
    await db.insert(segmentationRulePacks).values({
      id: `rp_${RULE_PACK_V1.version.replace(/\./g, '_')}`,
      version: RULE_PACK_V1.version,
      name: RULE_PACK_V1.name,
      description: RULE_PACK_V1.description,
      jurisdictions: RULE_PACK_V1.jurisdictions,
      rulesJson: serializeRulePackForDb(RULE_PACK_V1),
      isActive: true,
    });
    console.log(`Rule pack v${RULE_PACK_V1.version} inserted into database`);
  }
}

export async function createRegulationFromDocument(
  docId: number,
  metadata: RegulationMetadata,
  organizationId?: string
): Promise<string> {
  const regulationId = generateId('reg');
  
  await db.insert(regulations).values({
    id: regulationId,
    organizationId: organizationId || null,
    jurisdiction: metadata.jurisdiction,
    regulator: metadata.regulator,
    language: metadata.language,
    title: metadata.title,
    effectiveDate: metadata.effectiveDate || null,
    versionLabel: metadata.versionLabel,
    sourceUrl: metadata.sourceUrl || null,
    sourceType: 'upload',
    processingStatus: 'pending',
    segmentationStatus: 'pending',
    regulatoryDocId: docId,
  });
  
  return regulationId;
}

export async function processRegulation(
  regulationId: string,
  forceReprocess: boolean = false
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    const [regulation] = await db.select()
      .from(regulations)
      .where(eq(regulations.id, regulationId))
      .limit(1);
    
    if (!regulation) {
      return {
        regulationId,
        status: 'failed',
        legalUnitsCreated: 0,
        errors: ['Regulation not found'],
        processingTimeMs: Date.now() - startTime,
      };
    }
    
    await db.update(regulations)
      .set({ processingStatus: 'processing', updatedAt: new Date() })
      .where(eq(regulations.id, regulationId));
    
    let fullText: string = '';
    let pagesData: Array<{ page: number; text: string; startOffset: number }> = [];
    let ocrArtifactId: string | undefined;
    
    if (regulation.regulatoryDocId) {
      const [doc] = await db.select()
        .from(regulatoryDocuments)
        .where(eq(regulatoryDocuments.id, regulation.regulatoryDocId))
        .limit(1);
      
      if (doc?.extractedText) {
        fullText = doc.extractedText;
        pagesData = splitTextIntoPages(fullText);
      } else if (doc?.storagePath) {
        try {
          const ocrResult = await performOcrOnDocument(regulationId, doc.storagePath, doc.id);
          fullText = ocrResult.fullText;
          pagesData = ocrResult.pagesData;
          ocrArtifactId = ocrResult.artifactId;
        } catch (ocrError) {
          errors.push(`OCR failed: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}`);
        }
      }
    }
    
    if (!fullText || fullText.length < 100) {
      await db.update(regulations)
        .set({ 
          processingStatus: 'failed',
          segmentationStatus: 'failed',
          needsManualReview: true,
          updatedAt: new Date()
        })
        .where(eq(regulations.id, regulationId));
      
      return {
        regulationId,
        status: 'failed',
        ocrArtifactId,
        legalUnitsCreated: 0,
        errors: [...errors, 'Insufficient text content for segmentation'],
        processingTimeMs: Date.now() - startTime,
      };
    }
    
    const segResult = segmentRegulation(
      regulationId,
      fullText,
      regulation.jurisdiction,
      regulation.language,
      pagesData
    );
    
    if (forceReprocess) {
      await db.delete(legalUnits).where(eq(legalUnits.regulationId, regulationId));
    }
    
    let unitsCreated = 0;
    for (const unit of segResult.units) {
      try {
        await db.insert(legalUnits).values({
          id: unit.id,
          regulationId,
          language: regulation.language,
          unitType: unit.unitType,
          unitKey: unit.unitKey,
          parentUnitKey: unit.parentUnitKey,
          parentUnitId: unit.parentUnitId,
          rawText: unit.rawText,
          anchorsJson: unit.anchors,
          textHash: unit.textHash,
          ordinal: unit.ordinal,
          depth: unit.depth,
        });
        unitsCreated++;
      } catch (insertError) {
        errors.push(`Failed to insert unit ${unit.unitKey}: ${insertError instanceof Error ? insertError.message : String(insertError)}`);
      }
    }
    
    const finalStatus = segResult.status === 'failed' ? 'failed' : 
                        segResult.status === 'fallback' ? 'segmented' : 
                        'segmented';
    
    await db.update(regulations)
      .set({
        processingStatus: finalStatus,
        segmentationStatus: segResult.status,
        segmentationConfidence: segResult.confidence,
        segmentationRulePackVersion: segResult.rulePackVersion,
        needsManualReview: segResult.needsManualReview,
        updatedAt: new Date(),
      })
      .where(eq(regulations.id, regulationId));
    
    await logAiAudit({
      eventType: 'segment_document',
      model: 'regex',
      modelVersion: segResult.rulePackVersion,
      promptTemplateHash: computeTextHash('segmentation_rules'),
      inputHash: computeTextHash(fullText.slice(0, 1000)),
      outputHash: computeTextHash(JSON.stringify(segResult.units.map(u => u.unitKey))),
      inputJson: {
        regulationId,
        jurisdiction: regulation.jurisdiction,
        textLength: fullText.length,
      },
      outputJson: {
        status: segResult.status,
        confidence: segResult.confidence,
        totalUnits: segResult.totalUnits,
        unitTypes: Array.from(new Set(segResult.units.map(u => u.unitType))),
      },
      regulationId,
      processingTimeMs: Date.now() - startTime,
      success: segResult.status !== 'failed',
      errorMessage: errors.length > 0 ? errors.join('; ') : null,
    });
    
    return {
      regulationId,
      status: segResult.status === 'failed' ? 'failed' : 
              errors.length > 0 ? 'partial' : 'success',
      ocrArtifactId,
      segmentationResult: segResult,
      legalUnitsCreated: unitsCreated,
      errors: [...errors, ...segResult.errors],
      processingTimeMs: Date.now() - startTime,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await db.update(regulations)
      .set({
        processingStatus: 'failed',
        segmentationStatus: 'failed',
        needsManualReview: true,
        updatedAt: new Date(),
      })
      .where(eq(regulations.id, regulationId));
    
    return {
      regulationId,
      status: 'failed',
      legalUnitsCreated: 0,
      errors: [...errors, `Processing error: ${errorMessage}`],
      processingTimeMs: Date.now() - startTime,
    };
  }
}

async function performOcrOnDocument(
  regulationId: string,
  storagePath: string,
  docId: number
): Promise<{ fullText: string; pagesData: Array<{ page: number; text: string; startOffset: number }>; artifactId: string }> {
  const fullText = ""; 
  const pagesData: Array<{ page: number; text: string; startOffset: number }> = [];
  
  const artifactId = generateId('ocr');
  
  await db.insert(ocrArtifacts).values({
    id: artifactId,
    regulationId,
    documentId: docId,
    provider: 'existing_extraction',
    fullText: fullText || 'Pending OCR',
    pagesJson: pagesData.length > 0 ? pagesData : [{ page: 1, text: '', startOffset: 0 }],
  });
  
  return { fullText, pagesData, artifactId };
}

function splitTextIntoPages(text: string, avgPageLength: number = 3000): Array<{ page: number; text: string; startOffset: number }> {
  const pages: Array<{ page: number; text: string; startOffset: number }> = [];
  let offset = 0;
  let pageNum = 1;
  
  while (offset < text.length) {
    let endOffset = Math.min(offset + avgPageLength, text.length);
    
    if (endOffset < text.length) {
      const newlinePos = text.indexOf('\n\n', endOffset - 200);
      if (newlinePos !== -1 && newlinePos < endOffset + 200) {
        endOffset = newlinePos + 2;
      }
    }
    
    pages.push({
      page: pageNum,
      text: text.slice(offset, endOffset),
      startOffset: offset,
    });
    
    offset = endOffset;
    pageNum++;
  }
  
  return pages;
}

async function logAiAudit(params: {
  eventType: string;
  model: string;
  modelVersion: string;
  promptTemplateHash: string;
  inputHash: string;
  outputHash: string;
  inputJson: object;
  outputJson: object;
  regulationId?: string;
  legalUnitId?: string;
  obligationId?: string;
  processingTimeMs?: number;
  tokensUsed?: number;
  success?: boolean;
  errorMessage?: string | null;
}): Promise<void> {
  try {
    await db.insert(aiAuditLog).values({
      id: generateId('ai'),
      eventType: params.eventType,
      model: params.model,
      modelVersion: params.modelVersion,
      promptTemplateHash: params.promptTemplateHash,
      inputHash: params.inputHash,
      outputHash: params.outputHash,
      inputJson: params.inputJson,
      outputJson: params.outputJson,
      regulationId: params.regulationId || null,
      legalUnitId: params.legalUnitId || null,
      obligationId: params.obligationId || null,
      processingTimeMs: params.processingTimeMs || null,
      tokensUsed: params.tokensUsed || null,
      success: params.success ?? true,
      errorMessage: params.errorMessage || null,
    });
  } catch (error) {
    console.error('Failed to log AI audit:', error);
  }
}

export async function reprocessExistingDocument(docId: number): Promise<ProcessingResult | null> {
  const [doc] = await db.select()
    .from(regulatoryDocuments)
    .where(eq(regulatoryDocuments.id, docId))
    .limit(1);
  
  if (!doc) {
    return null;
  }
  
  const existingReg = await db.select()
    .from(regulations)
    .where(eq(regulations.regulatoryDocId, docId))
    .limit(1);
  
  let regulationId: string;
  
  if (existingReg.length > 0) {
    regulationId = existingReg[0].id;
  } else {
    regulationId = await createRegulationFromDocument(docId, {
      jurisdiction: doc.jurisdiction,
      regulator: doc.regulator,
      language: 'en',
      title: doc.title,
      effectiveDate: doc.effectiveAt?.toISOString().split('T')[0],
      versionLabel: doc.version || 'v1',
      sourceUrl: doc.url || undefined,
    });
  }
  
  return processRegulation(regulationId, true);
}
