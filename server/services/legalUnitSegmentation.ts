import { 
  getRulePackForJurisdiction, 
  getFallbackRulePack, 
  getCurrentRulePackVersion,
  computeTextHash,
  generateId,
  type JurisdictionRulePack,
  type SegmentationPattern
} from './segmentationRulePacks';

export interface TextAnchor {
  page: number;
  textStart: number;
  textEnd: number;
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface ExtractedLegalUnit {
  id: string;
  unitType: string;
  unitKey: string;
  parentUnitKey: string | null;
  parentUnitId: string | null;
  rawText: string;
  anchors: TextAnchor[];
  textHash: string;
  ordinal: number;
  depth: number;
}

export interface SegmentationResult {
  regulationId: string;
  language: string;
  status: 'normal' | 'fallback' | 'failed';
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  rulePackVersion: string;
  needsManualReview: boolean;
  units: ExtractedLegalUnit[];
  totalUnits: number;
  errors: string[];
}

interface RawMatch {
  unitType: string;
  unitKey: string;
  startIndex: number;
  endIndex: number;
  priority: number;
  text: string;
}

export class LegalUnitSegmenter {
  private rulePack: JurisdictionRulePack;
  private isFallback: boolean;
  private rulePackVersion: string;

  constructor(jurisdiction: string) {
    const jurisdictionRules = getRulePackForJurisdiction(jurisdiction);
    if (jurisdictionRules) {
      this.rulePack = jurisdictionRules;
      this.isFallback = false;
    } else {
      this.rulePack = getFallbackRulePack();
      this.isFallback = true;
    }
    this.rulePackVersion = getCurrentRulePackVersion();
  }

  segment(
    regulationId: string,
    fullText: string,
    language: string,
    pagesData?: Array<{ page: number; text: string; startOffset: number }>
  ): SegmentationResult {
    const errors: string[] = [];
    const units: ExtractedLegalUnit[] = [];

    try {
      const highLevelMatches = this.extractHighLevelUnits(fullText);
      
      if (highLevelMatches.length === 0) {
        const sectionMatches = this.extractSections(fullText);
        
        if (sectionMatches.length === 0) {
          errors.push('No legal units detected with any pattern');
          return {
            regulationId,
            language,
            status: 'failed',
            confidence: 'unknown',
            rulePackVersion: this.rulePackVersion,
            needsManualReview: true,
            units: [],
            totalUnits: 0,
            errors,
          };
        }
        
        for (let i = 0; i < sectionMatches.length; i++) {
          const match = sectionMatches[i];
          const anchors = this.computeAnchors(match.startIndex, match.endIndex, pagesData);
          
          units.push({
            id: generateId('lu'),
            unitType: match.unitType,
            unitKey: match.unitKey,
            parentUnitKey: null,
            parentUnitId: null,
            rawText: match.text,
            anchors,
            textHash: computeTextHash(match.text),
            ordinal: i + 1,
            depth: 0,
          });
        }
      } else {
        let ordinalCounter = 0;
        
        for (const hlMatch of highLevelMatches) {
          ordinalCounter++;
          const parentId = generateId('lu');
          const anchors = this.computeAnchors(hlMatch.startIndex, hlMatch.endIndex, pagesData);
          
          units.push({
            id: parentId,
            unitType: hlMatch.unitType,
            unitKey: hlMatch.unitKey,
            parentUnitKey: null,
            parentUnitId: null,
            rawText: hlMatch.text,
            anchors,
            textHash: computeTextHash(hlMatch.text),
            ordinal: ordinalCounter,
            depth: 0,
          });
          
          const childUnits = this.extractChildUnits(
            hlMatch.text, 
            hlMatch.unitKey,
            parentId,
            hlMatch.startIndex,
            pagesData
          );
          units.push(...childUnits);
        }
      }

      const confidence = this.assessConfidence(units, fullText.length);
      
      return {
        regulationId,
        language,
        status: this.isFallback ? 'fallback' : 'normal',
        confidence,
        rulePackVersion: this.rulePackVersion,
        needsManualReview: this.isFallback || confidence === 'low',
        units,
        totalUnits: units.length,
        errors,
      };
    } catch (error) {
      errors.push(`Segmentation error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        regulationId,
        language,
        status: 'failed',
        confidence: 'unknown',
        rulePackVersion: this.rulePackVersion,
        needsManualReview: true,
        units: [],
        totalUnits: 0,
        errors,
      };
    }
  }

  private extractHighLevelUnits(text: string): RawMatch[] {
    const matches: RawMatch[] = [];
    const highLevelPatterns = this.rulePack.patterns.filter(
      p => ['part', 'chapter', 'title', 'book', 'division'].includes(p.unitType)
    );

    for (const pattern of highLevelPatterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const unitKey = pattern.keyExtractor(match);
        const nextMatch = this.findNextHighLevelMatch(text, regex.lastIndex, highLevelPatterns);
        const endIndex = nextMatch !== -1 ? nextMatch : text.length;
        
        matches.push({
          unitType: pattern.unitType,
          unitKey,
          startIndex: match.index,
          endIndex,
          priority: pattern.priority,
          text: text.slice(match.index, endIndex).trim(),
        });
      }
    }

    matches.sort((a, b) => a.startIndex - b.startIndex);
    return this.deduplicateOverlappingMatches(matches);
  }

  private extractSections(text: string): RawMatch[] {
    const matches: RawMatch[] = [];
    const sectionPatterns = this.rulePack.patterns.filter(
      p => p.unitType === 'section'
    );

    for (const pattern of sectionPatterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;
      const allMatches: Array<{ index: number; key: string }> = [];
      
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          index: match.index,
          key: pattern.keyExtractor(match),
        });
      }

      for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        const next = allMatches[i + 1];
        const endIndex = next ? next.index : text.length;
        
        matches.push({
          unitType: 'section',
          unitKey: current.key,
          startIndex: current.index,
          endIndex,
          priority: pattern.priority,
          text: text.slice(current.index, endIndex).trim(),
        });
      }
    }

    matches.sort((a, b) => a.startIndex - b.startIndex);
    return this.deduplicateOverlappingMatches(matches);
  }

  private extractChildUnits(
    parentText: string,
    parentUnitKey: string,
    parentUnitId: string,
    parentOffset: number,
    pagesData?: Array<{ page: number; text: string; startOffset: number }>
  ): ExtractedLegalUnit[] {
    const units: ExtractedLegalUnit[] = [];
    const childPatterns = this.rulePack.patterns.filter(
      p => ['section', 'subsection', 'paragraph', 'clause', 'proviso'].includes(p.unitType)
    );

    const sectionMatches = this.extractSectionsFromText(parentText, childPatterns.filter(p => p.unitType === 'section'));
    
    let ordinal = 0;
    for (const sectionMatch of sectionMatches) {
      ordinal++;
      const sectionId = generateId('lu');
      const globalStart = parentOffset + sectionMatch.startIndex;
      const globalEnd = parentOffset + sectionMatch.endIndex;
      const anchors = this.computeAnchors(globalStart, globalEnd, pagesData);
      
      units.push({
        id: sectionId,
        unitType: 'section',
        unitKey: sectionMatch.unitKey,
        parentUnitKey,
        parentUnitId,
        rawText: sectionMatch.text,
        anchors,
        textHash: computeTextHash(sectionMatch.text),
        ordinal,
        depth: 1,
      });

      const subUnits = this.extractSubUnits(
        sectionMatch.text,
        sectionMatch.unitKey,
        sectionId,
        globalStart,
        pagesData
      );
      units.push(...subUnits);
    }

    return units;
  }

  private extractSectionsFromText(text: string, patterns: SegmentationPattern[]): RawMatch[] {
    const matches: RawMatch[] = [];
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;
      const allMatches: Array<{ index: number; key: string }> = [];
      
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          index: match.index,
          key: pattern.keyExtractor(match),
        });
      }

      for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        const next = allMatches[i + 1];
        const endIndex = next ? next.index : text.length;
        
        matches.push({
          unitType: 'section',
          unitKey: current.key,
          startIndex: current.index,
          endIndex,
          priority: pattern.priority,
          text: text.slice(current.index, endIndex).trim(),
        });
      }
    }

    matches.sort((a, b) => a.startIndex - b.startIndex);
    return this.deduplicateOverlappingMatches(matches);
  }

  private extractSubUnits(
    sectionText: string,
    sectionKey: string,
    sectionId: string,
    sectionOffset: number,
    pagesData?: Array<{ page: number; text: string; startOffset: number }>
  ): ExtractedLegalUnit[] {
    const units: ExtractedLegalUnit[] = [];
    const subPatterns = this.rulePack.patterns.filter(
      p => ['subsection', 'paragraph', 'clause', 'proviso'].includes(p.unitType)
    );

    let ordinal = 0;
    for (const pattern of subPatterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;
      
      while ((match = regex.exec(sectionText)) !== null) {
        ordinal++;
        const unitKey = pattern.keyExtractor(match);
        const startIndex = match.index;
        const nextMatch = regex.exec(sectionText);
        regex.lastIndex = match.index + 1;
        const endIndex = nextMatch ? nextMatch.index : Math.min(startIndex + 500, sectionText.length);
        
        const globalStart = sectionOffset + startIndex;
        const globalEnd = sectionOffset + endIndex;
        const anchors = this.computeAnchors(globalStart, globalEnd, pagesData);
        const rawText = sectionText.slice(startIndex, endIndex).trim();
        
        if (rawText.length > 10) {
          units.push({
            id: generateId('lu'),
            unitType: pattern.unitType,
            unitKey: `${sectionKey} ${unitKey}`,
            parentUnitKey: sectionKey,
            parentUnitId: sectionId,
            rawText,
            anchors,
            textHash: computeTextHash(rawText),
            ordinal,
            depth: 2,
          });
        }
      }
    }

    return units;
  }

  private findNextHighLevelMatch(
    text: string, 
    fromIndex: number, 
    patterns: SegmentationPattern[]
  ): number {
    let minIndex = -1;
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      regex.lastIndex = fromIndex;
      const match = regex.exec(text);
      
      if (match && (minIndex === -1 || match.index < minIndex)) {
        minIndex = match.index;
      }
    }
    
    return minIndex;
  }

  private deduplicateOverlappingMatches(matches: RawMatch[]): RawMatch[] {
    if (matches.length === 0) return matches;
    
    const result: RawMatch[] = [];
    let lastEnd = -1;
    
    for (const match of matches) {
      if (match.startIndex >= lastEnd) {
        result.push(match);
        lastEnd = match.endIndex;
      } else if (match.priority < result[result.length - 1].priority) {
        result[result.length - 1] = match;
        lastEnd = match.endIndex;
      }
    }
    
    return result;
  }

  private computeAnchors(
    startOffset: number,
    endOffset: number,
    pagesData?: Array<{ page: number; text: string; startOffset: number }>
  ): TextAnchor[] {
    if (!pagesData || pagesData.length === 0) {
      return [{
        page: 1,
        textStart: startOffset,
        textEnd: endOffset,
      }];
    }

    const anchors: TextAnchor[] = [];
    
    for (const pageData of pagesData) {
      const pageStart = pageData.startOffset;
      const pageEnd = pageData.startOffset + pageData.text.length;
      
      if (startOffset < pageEnd && endOffset > pageStart) {
        anchors.push({
          page: pageData.page,
          textStart: Math.max(startOffset, pageStart) - pageStart,
          textEnd: Math.min(endOffset, pageEnd) - pageStart,
        });
      }
    }
    
    return anchors.length > 0 ? anchors : [{
      page: 1,
      textStart: startOffset,
      textEnd: endOffset,
    }];
  }

  private assessConfidence(units: ExtractedLegalUnit[], textLength: number): 'high' | 'medium' | 'low' | 'unknown' {
    if (units.length === 0) return 'unknown';
    
    const totalCoveredText = units.reduce((sum, u) => sum + u.rawText.length, 0);
    const coverageRatio = totalCoveredText / textLength;
    
    const hasStructure = units.some(u => ['part', 'chapter', 'division'].includes(u.unitType));
    const hasSections = units.some(u => u.unitType === 'section');
    const avgTextLength = totalCoveredText / units.length;
    
    if (coverageRatio > 0.7 && hasStructure && hasSections && avgTextLength > 100) {
      return 'high';
    }
    
    if (coverageRatio > 0.4 && hasSections && avgTextLength > 50) {
      return 'medium';
    }
    
    return 'low';
  }
}

export function segmentRegulation(
  regulationId: string,
  fullText: string,
  jurisdiction: string,
  language: string,
  pagesData?: Array<{ page: number; text: string; startOffset: number }>
): SegmentationResult {
  const segmenter = new LegalUnitSegmenter(jurisdiction);
  return segmenter.segment(regulationId, fullText, language, pagesData);
}
