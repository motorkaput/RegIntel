import OpenAI from 'openai';
import { db } from '../db';
import { regulatoryObligations, legalUnits, regulations, aiAuditLog } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { generateId } from './segmentationRulePacks';

let _openai: OpenAI | null = null;
function getOpenAI() { return _openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }

export interface ExtractedObligation {
  obligationKey: string;
  obligationType: string;
  modality: string;
  subjectText: string;
  regulatedEntityTypes: string[];
  actionText: string;
  objectText?: string;
  conditionText?: string;
  deadlineText?: string;
  deadlineDays?: number;
  frequencyText?: string;
  thresholds: Array<{ thresholdText: string; amount?: number; currency?: string }>;
  exceptions: string[];
  penalties: string[];
  citations: Array<{ quote: string; textStart?: number; textEnd?: number }>;
  confidence: number;
}

export interface ExtractionResult {
  legalUnitId: string;
  legalUnitKey: string;
  obligations: ExtractedObligation[];
  processingTimeMs: number;
  error?: string;
}

const OBLIGATION_TYPES = [
  'mandatory_obligation',
  'conditional_obligation', 
  'prohibition',
  'reporting_requirement',
  'recordkeeping_requirement',
  'monitoring_requirement',
  'due_diligence_requirement',
  'risk_assessment_requirement',
  'appointment_requirement',
  'penalty_clause'
] as const;

const MODALITIES = [
  'must',
  'shall', 
  'should',
  'may',
  'must_not',
  'prohibited',
  'not_permitted',
  'conditional'
] as const;

const EXTRACTION_PROMPT = `You are a regulatory compliance expert. Analyze the following legal text and extract all regulatory obligations.

For each obligation found, identify:
1. **obligationType**: One of: mandatory_obligation, conditional_obligation, prohibition, reporting_requirement, recordkeeping_requirement, monitoring_requirement, due_diligence_requirement, risk_assessment_requirement, appointment_requirement, penalty_clause
2. **modality**: The deontic force: must, shall, should, may, must_not, prohibited, not_permitted, conditional
3. **subjectText**: Who is obligated (e.g., "the reporting entity", "a licensed bank")
4. **regulatedEntityTypes**: Array of entity types (e.g., ["bank", "vasp", "psp", "nbfc"])
5. **actionText**: What must be done (the core action)
6. **objectText**: What is acted upon (if applicable)
7. **conditionText**: Any conditions/triggers verbatim
8. **deadlineText**: Time constraints in original wording
9. **deadlineDays**: Numeric deadline if extractable
10. **frequencyText**: Recurring frequency if mentioned
11. **thresholds**: Amount thresholds [{thresholdText, amount?, currency?}]
12. **exceptions**: Any exceptions or exemptions verbatim
13. **penalties**: References to penalties/consequences
14. **citations**: Direct quotes from the text supporting this obligation [{quote}]
15. **confidence**: Your confidence 0.0-1.0 in this extraction

Return a JSON object with an "obligations" array. Example format:
{"obligations": [{"obligationType": "mandatory_obligation", "modality": "must", ...}]}
If no obligations found, return {"obligations": []}.

IMPORTANT:
- Extract obligations from regulatory/legal language only
- Include exact quotes for citations
- Be conservative with confidence - use lower values for ambiguous text
- Identify the SUBJECT clearly - who must comply
- Capture CONDITIONS verbatim when present`;

export async function extractObligationsFromLegalUnit(
  legalUnitId: string,
  regulationId: string
): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  const [unit] = await db.select().from(legalUnits)
    .where(eq(legalUnits.id, legalUnitId))
    .limit(1);
  
  if (!unit) {
    return {
      legalUnitId,
      legalUnitKey: 'unknown',
      obligations: [],
      processingTimeMs: Date.now() - startTime,
      error: 'Legal unit not found'
    };
  }

  const [reg] = await db.select().from(regulations)
    .where(eq(regulations.id, regulationId))
    .limit(1);

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { 
          role: 'user', 
          content: `Legal Unit: ${unit.unitKey}\nJurisdiction: ${reg?.jurisdiction || 'Unknown'}\nRegulator: ${reg?.regulator || 'Unknown'}\n\nText:\n${unit.rawText}` 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content || '{"obligations":[]}';
    let parsed: { obligations?: ExtractedObligation[] };
    
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { obligations: [] };
    }

    const obligations = (parsed.obligations || []).map((obl, idx) => ({
      ...obl,
      obligationKey: `${unit.unitKey}_OBL_${idx + 1}`,
      obligationType: OBLIGATION_TYPES.includes(obl.obligationType as any) 
        ? obl.obligationType 
        : 'mandatory_obligation',
      modality: MODALITIES.includes(obl.modality as any) 
        ? obl.modality 
        : 'shall',
      regulatedEntityTypes: obl.regulatedEntityTypes || [],
      thresholds: obl.thresholds || [],
      exceptions: obl.exceptions || [],
      penalties: obl.penalties || [],
      citations: obl.citations || [],
      confidence: Math.min(1, Math.max(0, obl.confidence || 0.5))
    }));

    const inputPayload = { unitKey: unit.unitKey, textLength: unit.rawText.length };
    const outputPayload = { obligationCount: obligations.length };
    
    await db.insert(aiAuditLog).values({
      id: generateId('aud'),
      eventType: 'extract_obligations',
      model: 'gpt-4.1',
      promptTemplateHash: 'obligation_extraction_v1',
      inputHash: unit.textHash,
      outputHash: `obl_count_${obligations.length}`,
      inputJson: inputPayload,
      outputJson: outputPayload,
      regulationId,
      legalUnitId,
      processingTimeMs: Date.now() - startTime,
      tokensUsed: (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0),
      success: true
    });

    return {
      legalUnitId,
      legalUnitKey: unit.unitKey,
      obligations,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error: any) {
    const inputPayload = { unitKey: unit.unitKey, textLength: unit.rawText.length };
    
    await db.insert(aiAuditLog).values({
      id: generateId('aud'),
      eventType: 'extract_obligations',
      model: 'gpt-4.1',
      promptTemplateHash: 'obligation_extraction_v1',
      inputHash: unit.textHash,
      outputHash: 'error',
      inputJson: inputPayload,
      outputJson: { error: error.message },
      regulationId,
      legalUnitId,
      processingTimeMs: Date.now() - startTime,
      tokensUsed: 0,
      success: false,
      errorMessage: error.message
    });

    return {
      legalUnitId,
      legalUnitKey: unit.unitKey,
      obligations: [],
      processingTimeMs: Date.now() - startTime,
      error: error.message
    };
  }
}

export async function storeExtractedObligations(
  regulationId: string,
  extractions: ExtractionResult[]
): Promise<{ stored: number; errors: string[] }> {
  let stored = 0;
  const errors: string[] = [];

  const [reg] = await db.select().from(regulations)
    .where(eq(regulations.id, regulationId))
    .limit(1);

  for (const extraction of extractions) {
    if (extraction.error) {
      errors.push(`${extraction.legalUnitKey}: ${extraction.error}`);
      continue;
    }

    for (const obl of extraction.obligations) {
      try {
        await db.insert(regulatoryObligations).values({
          id: generateId('obl'),
          regulationId,
          legalUnitId: extraction.legalUnitId,
          legalUnitKey: extraction.legalUnitKey,
          language: reg?.language || 'en',
          obligationKey: obl.obligationKey,
          obligationType: obl.obligationType,
          modality: obl.modality,
          subjectText: obl.subjectText || 'Unspecified entity',
          regulatedEntityTypesJson: obl.regulatedEntityTypes,
          actionText: obl.actionText || '',
          objectText: obl.objectText || null,
          conditionText: obl.conditionText || null,
          deadlineText: obl.deadlineText || '',
          deadlineDays: obl.deadlineDays || null,
          frequencyText: obl.frequencyText || '',
          thresholdsJson: obl.thresholds,
          exceptionsJson: obl.exceptions,
          penaltiesJson: obl.penalties,
          citationsJson: obl.citations,
          confidence: obl.confidence.toFixed(2),
          reviewStatus: 'unreviewed'
        });
        stored++;
      } catch (err: any) {
        errors.push(`${obl.obligationKey}: ${err.message}`);
      }
    }
  }

  return { stored, errors };
}

export async function extractAllObligationsForRegulation(
  regulationId: string,
  options: { batchSize?: number; unitTypes?: string[] } = {}
): Promise<{ 
  totalUnits: number; 
  processedUnits: number; 
  obligationsExtracted: number; 
  errors: string[] 
}> {
  const { batchSize = 5, unitTypes = ['section', 'subsection', 'paragraph', 'clause'] } = options;
  
  const units = await db.select().from(legalUnits)
    .where(eq(legalUnits.regulationId, regulationId))
    .orderBy(legalUnits.ordinal);

  const filteredUnits = units.filter(u => unitTypes.includes(u.unitType));
  
  let processedUnits = 0;
  let obligationsExtracted = 0;
  const allErrors: string[] = [];

  for (let i = 0; i < filteredUnits.length; i += batchSize) {
    const batch = filteredUnits.slice(i, i + batchSize);
    
    const extractions = await Promise.all(
      batch.map(unit => extractObligationsFromLegalUnit(unit.id, regulationId))
    );

    const storeResult = await storeExtractedObligations(regulationId, extractions);
    
    processedUnits += batch.length;
    obligationsExtracted += storeResult.stored;
    allErrors.push(...storeResult.errors);
  }

  await db.update(regulations)
    .set({ processingStatus: 'extracted', updatedAt: new Date() })
    .where(eq(regulations.id, regulationId));

  return {
    totalUnits: units.length,
    processedUnits,
    obligationsExtracted,
    errors: allErrors
  };
}
