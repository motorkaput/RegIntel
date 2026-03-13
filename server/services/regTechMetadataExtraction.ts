import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ExtractedMetadata {
  title: string;
  jurisdiction: string | null;
  regulator: string | null;
  publishedAt: string | null;
  effectiveAt: string | null;
  instrumentType: string | null;
  isComplianceRelated: boolean;
}

export async function extractDocumentMetadata(text: string, filename: string): Promise<ExtractedMetadata> {
  const prompt = `Analyze this document and extract regulatory metadata.

**First, determine if this is a compliance/regulatory document:**
A document is compliance-related if it involves ANY of the following topics:
- AML (Anti-Money Laundering), KYC (Know Your Customer), CFT (Counter-Terrorist Financing)
- Financial regulation, banking regulations, financial services regulations
- Sanctions, suspicious activity reporting, financial crime
- Customer due diligence (CDD), enhanced due diligence (EDD)
- Regulatory guidance, compliance requirements, risk assessment
- Money laundering regulations, terrorist financing, beneficial ownership
- Payment services, transfer of funds, electronic money
- Statutory instruments, acts, or regulations from financial regulators
- FCA, FinCEN, FATF, MAS, AUSTRAC, or any financial regulatory body guidance

IMPORTANT: If the document title or content contains words like "Money Laundering", "Terrorist Financing", "Financial Services", "Regulations", "AML", "CFT", or similar regulatory terms, it IS compliance-related. Default to TRUE if uncertain.

**If the document IS compliance-related, extract:**
1. Jurisdiction code from: US, UK, EU, IN (India), SG (Singapore), HK (Hong Kong), AU (Australia), CA (Canada), MU (Mauritius), RU (Russia), JP (Japan), CN (China), KR (South Korea), BR (Brazil), MX (Mexico), ZA (South Africa), AE (UAE), SA (Saudi Arabia), MY (Malaysia), TH (Thailand), ID (Indonesia), PH (Philippines), VN (Vietnam), TW (Taiwan), NZ (New Zealand), CH (Switzerland), DE (Germany), FR (France), IT (Italy), ES (Spain), NL (Netherlands), BE (Belgium), IE (Ireland), LU (Luxembourg), GLOBAL
2. Regulator from: FATF, FinCEN, FCA, MAS, FIU-IND, FIU-MU (Mauritius FIU), AUSTRAC, FINTRAC, EBA, HKMA, Rosfinmonitoring (Russia), JFSA (Japan FSA), JAFIC (Japan FIU), PBC/PBOC (China), CBIRC (China), FSC (South Korea/Taiwan), KoFIU (South Korea), COAF (Brazil), UIF (Mexico), FIC (South Africa), CBUAE (UAE), SAMA (Saudi Arabia), BNM (Malaysia), AMLO (Thailand), PPATK (Indonesia), AMLC (Philippines), SBV (Vietnam), RBNZ (New Zealand), FINMA (Switzerland), BaFin (Germany), ACPR/AMF (France), Banca d'Italia (Italy), SEPBLAC (Spain), DNB (Netherlands), NBB (Belgium), CBI (Ireland)
3. Exact title of the document
4. Published date and effective date (format: YYYY-MM-DD)
5. Instrument type (e.g., Guidance, Regulation, Directive, Circular, Notice, Gazette, Consultation, Amendment, User Manual)

**Document text (first 6000 chars):**
${text.substring(0, 6000)}

**Filename:** ${filename}

Return a JSON object with this exact structure:
{
  "isComplianceRelated": true/false,
  "title": "...",
  "jurisdiction": "2-letter country code (US, UK, EU, RU, JP, CN, etc.) or GLOBAL, or null if unknown",
  "regulator": "Regulator name/acronym from the list above, or null if unknown",
  "publishedAt": "YYYY-MM-DD or null",
  "effectiveAt": "YYYY-MM-DD or null",
  "instrumentType": "... or null"
}

IMPORTANT for non-English documents:
- Russian documents (Cyrillic) about money laundering = jurisdiction: RU, regulator: Rosfinmonitoring
- Japanese documents = jurisdiction: JP, regulator: JFSA or JAFIC  
- Chinese documents = jurisdiction: CN, regulator: PBC/PBOC or CBIRC
- Infer jurisdiction from language and content if not explicitly stated

If you cannot find a field, set it to null. Be accurate—only extract what you're confident about.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { 
          role: "system", 
          content: "You are a regulatory document metadata extractor. Always return valid JSON only, no explanations." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title || filename,
      jurisdiction: parsed.jurisdiction || null,
      regulator: parsed.regulator || null,
      publishedAt: parsed.publishedAt || null,
      effectiveAt: parsed.effectiveAt || null,
      instrumentType: parsed.instrumentType || null,
      isComplianceRelated: parsed.isComplianceRelated !== false,
    };

  } catch (error) {
    console.error('Metadata extraction failed:', error);
    return {
      title: filename,
      jurisdiction: null,
      regulator: null,
      publishedAt: null,
      effectiveAt: null,
      instrumentType: null,
      isComplianceRelated: true,
    };
  }
}
