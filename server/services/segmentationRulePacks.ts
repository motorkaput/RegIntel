import crypto from 'crypto';

export interface SegmentationPattern {
  unitType: 'book' | 'part' | 'chapter' | 'title' | 'division' | 'section' | 'article' | 'clause' | 'paragraph' | 'subsection' | 'proviso';
  pattern: RegExp;
  keyExtractor: (match: RegExpMatchArray) => string;
  priority: number;
}

export interface JurisdictionRulePack {
  jurisdiction: string;
  jurisdictionName: string;
  language: string;
  style: 'common-law' | 'civil-law';
  patterns: SegmentationPattern[];
}

export interface RulePackConfig {
  version: string;
  name: string;
  description: string;
  jurisdictions: string[];
  rules: JurisdictionRulePack[];
}

const UK_PATTERNS: SegmentationPattern[] = [
  {
    unitType: 'part',
    pattern: /^Part\s+([IVXLCDM]+|\d+)\b[\s\S]*?(?=^Part\s+[IVXLCDM\d]|\Z)/gim,
    keyExtractor: (m) => `Part ${m[1]}`,
    priority: 10,
  },
  {
    unitType: 'chapter',
    pattern: /^Chapter\s+(\d+)\b[\s\S]*?(?=^Chapter\s+\d|\Z)/gim,
    keyExtractor: (m) => `Chapter ${m[1]}`,
    priority: 20,
  },
  {
    unitType: 'section',
    pattern: /(?:^|\n)(?:Section\s+)?(\d+[A-Z]?)\.\s*[\s\S]*?(?=(?:^|\n)(?:Section\s+)?\d+[A-Z]?\.|$)/gi,
    keyExtractor: (m) => `Section ${m[1]}`,
    priority: 30,
  },
  {
    unitType: 'section',
    pattern: /(?:^|\n)s\.?\s*(\d+[A-Z]?)\b/gi,
    keyExtractor: (m) => `Section ${m[1]}`,
    priority: 31,
  },
  {
    unitType: 'subsection',
    pattern: /\((\d+)\)\s+/g,
    keyExtractor: (m) => `Subsection (${m[1]})`,
    priority: 40,
  },
  {
    unitType: 'paragraph',
    pattern: /\(([a-z])\)\s+/g,
    keyExtractor: (m) => `Paragraph (${m[1]})`,
    priority: 50,
  },
  {
    unitType: 'clause',
    pattern: /\(([ivx]+)\)\s+/gi,
    keyExtractor: (m) => `Clause (${m[1].toLowerCase()})`,
    priority: 60,
  },
  {
    unitType: 'proviso',
    pattern: /(?:Provided\s+that|Subject\s+to|Notwithstanding|Except\s+where)\s+/gi,
    keyExtractor: () => 'Proviso',
    priority: 70,
  },
];

const INDIA_PATTERNS: SegmentationPattern[] = [
  {
    unitType: 'part',
    pattern: /^Part\s+([IVXLCDM]+|\d+)\b/gim,
    keyExtractor: (m) => `Part ${m[1]}`,
    priority: 10,
  },
  {
    unitType: 'chapter',
    pattern: /^Chapter\s+([IVXLCDM]+|\d+)\b/gim,
    keyExtractor: (m) => `Chapter ${m[1]}`,
    priority: 20,
  },
  {
    unitType: 'section',
    pattern: /(?:^|\n)(?:Section\s+)?(\d+[A-Z]?)\.\s*/gi,
    keyExtractor: (m) => `Section ${m[1]}`,
    priority: 30,
  },
  {
    unitType: 'section',
    pattern: /(?:^|\n)s\.?\s*(\d+[A-Z]?)\b/gi,
    keyExtractor: (m) => `Section ${m[1]}`,
    priority: 31,
  },
  {
    unitType: 'subsection',
    pattern: /\((\d+)\)\s+/g,
    keyExtractor: (m) => `Sub-section (${m[1]})`,
    priority: 40,
  },
  {
    unitType: 'paragraph',
    pattern: /\(([a-z])\)\s+/g,
    keyExtractor: (m) => `Clause (${m[1]})`,
    priority: 50,
  },
  {
    unitType: 'clause',
    pattern: /\(([ivx]+)\)\s+/gi,
    keyExtractor: (m) => `Sub-clause (${m[1].toLowerCase()})`,
    priority: 60,
  },
  {
    unitType: 'proviso',
    pattern: /(?:Provided\s+that|Subject\s+to|Notwithstanding|Explanation)\s*/gi,
    keyExtractor: () => 'Proviso',
    priority: 70,
  },
];

const SINGAPORE_PATTERNS: SegmentationPattern[] = [
  {
    unitType: 'part',
    pattern: /^Part\s+([IVXLCDM]+|\d+)\b/gim,
    keyExtractor: (m) => `Part ${m[1]}`,
    priority: 10,
  },
  {
    unitType: 'division',
    pattern: /^Division\s+(\d+)\b/gim,
    keyExtractor: (m) => `Division ${m[1]}`,
    priority: 15,
  },
  {
    unitType: 'section',
    pattern: /(?:^|\n)(?:Section\s+)?(\d+[A-Z]?)\.\s*/gi,
    keyExtractor: (m) => `Section ${m[1]}`,
    priority: 30,
  },
  {
    unitType: 'subsection',
    pattern: /\((\d+)\)\s+/g,
    keyExtractor: (m) => `Subsection (${m[1]})`,
    priority: 40,
  },
  {
    unitType: 'paragraph',
    pattern: /\(([a-z])\)\s+/g,
    keyExtractor: (m) => `Paragraph (${m[1]})`,
    priority: 50,
  },
  {
    unitType: 'clause',
    pattern: /\(([ivx]+)\)\s+/gi,
    keyExtractor: (m) => `Sub-paragraph (${m[1].toLowerCase()})`,
    priority: 60,
  },
  {
    unitType: 'proviso',
    pattern: /(?:Provided\s+that|Subject\s+to|Notwithstanding)\s*/gi,
    keyExtractor: () => 'Proviso',
    priority: 70,
  },
];

const AUSTRALIA_PATTERNS: SegmentationPattern[] = [
  {
    unitType: 'part',
    pattern: /^Part\s+([IVXLCDM]+|\d+(?:-\d+)?)\b/gim,
    keyExtractor: (m) => `Part ${m[1]}`,
    priority: 10,
  },
  {
    unitType: 'division',
    pattern: /^Division\s+(\d+)\b/gim,
    keyExtractor: (m) => `Division ${m[1]}`,
    priority: 15,
  },
  {
    unitType: 'section',
    pattern: /(?:^|\n)(\d+[A-Z]?(?:\.\d+)?)\s+/g,
    keyExtractor: (m) => `Section ${m[1]}`,
    priority: 30,
  },
  {
    unitType: 'subsection',
    pattern: /\((\d+)\)\s+/g,
    keyExtractor: (m) => `Subsection (${m[1]})`,
    priority: 40,
  },
  {
    unitType: 'paragraph',
    pattern: /\(([a-z])\)\s+/g,
    keyExtractor: (m) => `Paragraph (${m[1]})`,
    priority: 50,
  },
  {
    unitType: 'clause',
    pattern: /\(([ivx]+)\)\s+/gi,
    keyExtractor: (m) => `Subparagraph (${m[1].toLowerCase()})`,
    priority: 60,
  },
  {
    unitType: 'proviso',
    pattern: /(?:Provided\s+that|Subject\s+to|Despite|However)\s*/gi,
    keyExtractor: () => 'Proviso',
    priority: 70,
  },
];

const GENERIC_FALLBACK_PATTERNS: SegmentationPattern[] = [
  {
    unitType: 'section',
    pattern: /(?:^|\n)(\d+)\.\s+[A-Z]/gm,
    keyExtractor: (m) => `Section ${m[1]}`,
    priority: 30,
  },
  {
    unitType: 'paragraph',
    pattern: /(?:^|\n)(\d+\.\d+)\s+/gm,
    keyExtractor: (m) => `Paragraph ${m[1]}`,
    priority: 40,
  },
  {
    unitType: 'clause',
    pattern: /(?:^|\n)[-•]\s+/gm,
    keyExtractor: () => 'Bullet',
    priority: 50,
  },
];

export const RULE_PACK_V1: RulePackConfig = {
  version: '1.0.0',
  name: 'Phase 0 - UK Common Law Style',
  description: 'UK-style common law segmentation patterns for UK, India, Singapore, and Australia',
  jurisdictions: ['UK', 'IN', 'SG', 'AU'],
  rules: [
    {
      jurisdiction: 'UK',
      jurisdictionName: 'United Kingdom',
      language: 'en',
      style: 'common-law',
      patterns: UK_PATTERNS,
    },
    {
      jurisdiction: 'IN',
      jurisdictionName: 'India',
      language: 'en',
      style: 'common-law',
      patterns: INDIA_PATTERNS,
    },
    {
      jurisdiction: 'SG',
      jurisdictionName: 'Singapore',
      language: 'en',
      style: 'common-law',
      patterns: SINGAPORE_PATTERNS,
    },
    {
      jurisdiction: 'AU',
      jurisdictionName: 'Australia',
      language: 'en',
      style: 'common-law',
      patterns: AUSTRALIA_PATTERNS,
    },
  ],
};

export const FALLBACK_RULE_PACK: JurisdictionRulePack = {
  jurisdiction: 'GENERIC',
  jurisdictionName: 'Generic Fallback',
  language: 'en',
  style: 'common-law',
  patterns: GENERIC_FALLBACK_PATTERNS,
};

export function getRulePackForJurisdiction(jurisdiction: string): JurisdictionRulePack | null {
  const normalizedJurisdiction = jurisdiction.toUpperCase();
  const rule = RULE_PACK_V1.rules.find(r => r.jurisdiction === normalizedJurisdiction);
  return rule || null;
}

export function getFallbackRulePack(): JurisdictionRulePack {
  return FALLBACK_RULE_PACK;
}

export function getCurrentRulePackVersion(): string {
  return RULE_PACK_V1.version;
}

export function serializeRulePackForDb(config: RulePackConfig): object {
  return {
    version: config.version,
    name: config.name,
    description: config.description,
    jurisdictions: config.jurisdictions,
    rules: config.rules.map(r => ({
      jurisdiction: r.jurisdiction,
      jurisdictionName: r.jurisdictionName,
      language: r.language,
      style: r.style,
      patternCount: r.patterns.length,
      patternDefinitions: r.patterns.map(p => ({
        unitType: p.unitType,
        patternSource: p.pattern.source,
        patternFlags: p.pattern.flags,
        priority: p.priority,
      })),
    })),
  };
}

export function computeTextHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}${random}`;
}
