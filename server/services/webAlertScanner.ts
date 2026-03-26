import * as cheerio from "cheerio";
import OpenAI from "openai";
import { REGULATORY_WEBSITES, DEFAULT_KEYWORDS } from "@shared/webAlertConstants";
import type { WebAlertSet, InsertWebAlert } from "@shared/schema";

let _openai: OpenAI | null = null;
function getOpenAI() { return _openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }

interface ScrapedContent {
  title: string;
  url: string;
  text: string;
  sourceName: string;
  jurisdiction: string;
}

interface AnalyzedAlert {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  jurisdiction: string;
  regulator: string;
  keywords: string[];
  impactScore: string;
  publishedAt: Date | null;
}

async function fetchWithTimeout(url: string, timeout = 15000): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.log(`Timeout fetching ${url}`);
    } else {
      console.log(`Error fetching ${url}:`, error.message);
    }
    return null;
  }
}

function extractTextContent($: cheerio.CheerioAPI): string {
  $("script, style, nav, header, footer, aside, iframe, noscript").remove();
  
  const textParts: string[] = [];
  
  $("article, .content, .main-content, main, .news-content, .press-release, .announcement").each((_, el) => {
    textParts.push($(el).text().trim());
  });
  
  if (textParts.length === 0) {
    $("h1, h2, h3, p, li, td").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        textParts.push(text);
      }
    });
  }
  
  return textParts
    .join("\n")
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .slice(0, 15000);
}

function extractNewsLinks($: cheerio.CheerioAPI, baseUrl: string): { title: string; url: string }[] {
  const links: { title: string; url: string }[] = [];
  const seen = new Set<string>();
  
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim();
    
    if (!href || !title || title.length < 10 || title.length > 300) return;
    
    const lowerTitle = title.toLowerCase();
    const lowerHref = href.toLowerCase();
    
    const isRelevant = 
      lowerTitle.includes("aml") ||
      lowerTitle.includes("anti-money") ||
      lowerTitle.includes("kyc") ||
      lowerTitle.includes("sanction") ||
      lowerTitle.includes("compliance") ||
      lowerTitle.includes("enforcement") ||
      lowerTitle.includes("penalty") ||
      lowerTitle.includes("fine") ||
      lowerTitle.includes("circular") ||
      lowerTitle.includes("guidance") ||
      lowerTitle.includes("regulation") ||
      lowerTitle.includes("press release") ||
      lowerTitle.includes("announcement") ||
      lowerHref.includes("press") ||
      lowerHref.includes("news") ||
      lowerHref.includes("circular") ||
      lowerHref.includes("announcement");
    
    if (!isRelevant) return;
    
    let fullUrl = href;
    if (href.startsWith("/")) {
      const base = new URL(baseUrl);
      fullUrl = `${base.protocol}//${base.host}${href}`;
    } else if (!href.startsWith("http")) {
      fullUrl = `${baseUrl}/${href}`;
    }
    
    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);
    
    links.push({ title, url: fullUrl });
  });
  
  return links.slice(0, 10);
}

async function scrapeRegulatoryWebsite(
  regulator: { name: string; url: string; newsUrl?: string },
  jurisdiction: string
): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];
  
  const urlToFetch = regulator.newsUrl || regulator.url;
  const html = await fetchWithTimeout(urlToFetch);
  
  if (!html) return results;
  
  const $ = cheerio.load(html);
  const newsLinks = extractNewsLinks($, regulator.url);
  
  if (newsLinks.length > 0) {
    for (const link of newsLinks.slice(0, 5)) {
      results.push({
        title: link.title,
        url: link.url,
        text: link.title,
        sourceName: regulator.name,
        jurisdiction,
      });
    }
  } else {
    const pageText = extractTextContent($);
    if (pageText.length > 100) {
      results.push({
        title: `Recent updates from ${regulator.name}`,
        url: urlToFetch,
        text: pageText,
        sourceName: regulator.name,
        jurisdiction,
      });
    }
  }
  
  return results;
}

async function analyzeContentWithOpenAI(
  scrapedContent: ScrapedContent[],
  keywords: string[]
): Promise<AnalyzedAlert[]> {
  if (scrapedContent.length === 0) return [];
  
  const contentSummary = scrapedContent
    .map((c, i) => `[${i + 1}] Source: ${c.sourceName} (${c.jurisdiction})\nTitle: ${c.title}\nURL: ${c.url}\nContent: ${c.text.slice(0, 1000)}`)
    .join("\n\n---\n\n");
  
  const prompt = `You are a regulatory compliance analyst specializing in AML/CFT, KYC, and financial regulations.

Analyze the following scraped regulatory website content and identify newsworthy regulatory updates.

Keywords to prioritize: ${keywords.join(", ")}

Content to analyze:
${contentSummary}

For each relevant regulatory update found, provide a JSON array of objects with:
- title: Clear, descriptive title of the regulatory update
- summary: 2-3 sentence summary of the key points and implications for financial institutions
- sourceUrl: The URL where this was found
- sourceName: The regulatory body name
- jurisdiction: The jurisdiction this applies to
- regulator: The specific regulator issuing this update
- matchedKeywords: Array of keywords from the provided list that this content matches
- impactScore: A number from 0.00 to 1.00 indicating relevance/importance (1.00 = critical, 0.50 = moderate, 0.20 = minor)

Only include genuinely newsworthy regulatory updates. Skip generic website content, navigation elements, or outdated information.

Respond with ONLY a valid JSON array. If no relevant updates are found, respond with an empty array [].`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    
    return parsed.map((item: any) => ({
      title: item.title || "Regulatory Update",
      summary: item.summary || "",
      sourceUrl: item.sourceUrl || "",
      sourceName: item.sourceName || "",
      jurisdiction: item.jurisdiction || "",
      regulator: item.regulator || item.sourceName || "",
      keywords: item.matchedKeywords || [],
      impactScore: String(item.impactScore || "0.50"),
      publishedAt: null,
    }));
  } catch (error: any) {
    console.error("OpenAI analysis error:", error.message);
    return [];
  }
}

export async function scanAlertSet(alertSet: WebAlertSet): Promise<InsertWebAlert[]> {
  // Parse regions from the comma-separated region field
  // REGULATORY_WEBSITES is keyed by region names (e.g., "India", "EU"), not jurisdiction names
  const regionsStr = alertSet.region || '';
  let regions = regionsStr.split(',').map(r => r.trim()).filter(Boolean);
  
  // Backward compatibility: if no regions but jurisdictions exist, try using jurisdictions as keys
  // Some jurisdictions like "India", "Singapore" match REGULATORY_WEBSITES keys directly
  if (regions.length === 0 && alertSet.jurisdictions?.length) {
    regions = alertSet.jurisdictions.filter(j => REGULATORY_WEBSITES[j]);
  }
  
  const keywords = alertSet.keywords?.length ? alertSet.keywords : DEFAULT_KEYWORDS;
  
  const allScrapedContent: ScrapedContent[] = [];
  
  // Use regions as keys for REGULATORY_WEBSITES lookup
  for (const region of regions) {
    const regulators = REGULATORY_WEBSITES[region] || [];
    
    for (const regulator of regulators) {
      try {
        const content = await scrapeRegulatoryWebsite(regulator, region);
        allScrapedContent.push(...content);
      } catch (error: any) {
        console.error(`Error scraping ${regulator.name}:`, error.message);
      }
    }
  }
  
  if (allScrapedContent.length === 0) {
    return [];
  }
  
  const analyzed = await analyzeContentWithOpenAI(allScrapedContent, keywords);
  
  return analyzed.map((alert) => ({
    userId: alertSet.userId,
    alertSetId: alertSet.id,
    title: alert.title,
    summary: alert.summary,
    sourceUrl: alert.sourceUrl,
    sourceName: alert.sourceName,
    jurisdiction: alert.jurisdiction,
    regulator: alert.regulator,
    keywords: alert.keywords,
    impactScore: alert.impactScore,
    publishedAt: alert.publishedAt,
    status: "unread",
  }));
}

export async function scanAllActiveAlertSets(
  alertSets: WebAlertSet[]
): Promise<Map<number, InsertWebAlert[]>> {
  const results = new Map<number, InsertWebAlert[]>();
  
  for (const alertSet of alertSets) {
    if (!alertSet.isActive) continue;
    
    try {
      const alerts = await scanAlertSet(alertSet);
      results.set(alertSet.id, alerts);
    } catch (error: any) {
      console.error(`Error scanning alert set ${alertSet.id}:`, error.message);
      results.set(alertSet.id, []);
    }
  }
  
  return results;
}
