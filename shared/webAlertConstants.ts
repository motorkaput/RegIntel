export const REGIONS = [
  "India",
  "Singapore", 
  "Hong Kong",
  "UAE",
  "Malaysia",
  "Thailand",
  "Indonesia",
  "Philippines",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Pakistan",
  "Australia",
  "UK",
  "EU",
  "US",
  "Global",
] as const;

export type Region = typeof REGIONS[number];

export const REGION_JURISDICTIONS: Record<Region, string[]> = {
  "India": ["India"],
  "Singapore": ["Singapore"],
  "Hong Kong": ["Hong Kong"],
  "UAE": ["UAE", "DIFC", "ADGM"],
  "Malaysia": ["Malaysia"],
  "Thailand": ["Thailand"],
  "Indonesia": ["Indonesia"],
  "Philippines": ["Philippines"],
  "Bangladesh": ["Bangladesh"],
  "Sri Lanka": ["Sri Lanka"],
  "Nepal": ["Nepal"],
  "Pakistan": ["Pakistan"],
  "Australia": ["Australia"],
  "UK": ["United Kingdom"],
  "EU": ["European Union", "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Luxembourg"],
  "US": ["United States"],
  "Global": ["FATF", "BIS", "FSB", "IOSCO", "BCBS", "Wolfsberg Group"],
};

export const REGULATORY_WEBSITES: Record<string, { name: string; url: string; newsUrl?: string }[]> = {
  "India": [
    { name: "RBI", url: "https://www.rbi.org.in", newsUrl: "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx" },
    { name: "SEBI", url: "https://www.sebi.gov.in", newsUrl: "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=8&smid=0" },
    { name: "FIU-IND", url: "https://fiuindia.gov.in" },
    { name: "IRDAI", url: "https://www.irdai.gov.in" },
  ],
  "Singapore": [
    { name: "MAS", url: "https://www.mas.gov.sg", newsUrl: "https://www.mas.gov.sg/news" },
  ],
  "Hong Kong": [
    { name: "HKMA", url: "https://www.hkma.gov.hk", newsUrl: "https://www.hkma.gov.hk/eng/news-and-media/press-releases/" },
    { name: "SFC", url: "https://www.sfc.hk", newsUrl: "https://www.sfc.hk/en/News-and-announcements" },
  ],
  "UAE": [
    { name: "CBUAE", url: "https://www.centralbank.ae", newsUrl: "https://www.centralbank.ae/en/media-center/" },
    { name: "SCA", url: "https://www.sca.gov.ae" },
    { name: "DIFC", url: "https://www.dfsa.ae" },
    { name: "ADGM", url: "https://www.adgm.com" },
  ],
  "Malaysia": [
    { name: "BNM", url: "https://www.bnm.gov.my", newsUrl: "https://www.bnm.gov.my/news" },
    { name: "SC Malaysia", url: "https://www.sc.com.my" },
  ],
  "Thailand": [
    { name: "BOT", url: "https://www.bot.or.th", newsUrl: "https://www.bot.or.th/en/news-and-media.html" },
    { name: "SEC Thailand", url: "https://www.sec.or.th" },
  ],
  "Indonesia": [
    { name: "OJK", url: "https://www.ojk.go.id", newsUrl: "https://www.ojk.go.id/en/berita-dan-kegiatan/siaran-pers/Default.aspx" },
    { name: "Bank Indonesia", url: "https://www.bi.go.id" },
  ],
  "Philippines": [
    { name: "BSP", url: "https://www.bsp.gov.ph", newsUrl: "https://www.bsp.gov.ph/SitePages/MediaAndResearch/MediaReleases.aspx" },
    { name: "AMLC", url: "https://www.amlc.gov.ph" },
  ],
  "Bangladesh": [
    { name: "Bangladesh Bank", url: "https://www.bb.org.bd" },
    { name: "BFIU", url: "https://www.bb.org.bd/bfiu" },
  ],
  "Sri Lanka": [
    { name: "CBSL", url: "https://www.cbsl.gov.lk", newsUrl: "https://www.cbsl.gov.lk/en/news" },
    { name: "FIU Sri Lanka", url: "https://fiusrilanka.gov.lk" },
  ],
  "Nepal": [
    { name: "NRB", url: "https://www.nrb.org.np", newsUrl: "https://www.nrb.org.np/red/notices-and-circulars/" },
  ],
  "Pakistan": [
    { name: "SBP", url: "https://www.sbp.org.pk", newsUrl: "https://www.sbp.org.pk/press/index.asp" },
    { name: "SECP", url: "https://www.secp.gov.pk" },
  ],
  "Australia": [
    { name: "AUSTRAC", url: "https://www.austrac.gov.au", newsUrl: "https://www.austrac.gov.au/news-and-media" },
    { name: "APRA", url: "https://www.apra.gov.au", newsUrl: "https://www.apra.gov.au/news-and-publications" },
    { name: "ASIC", url: "https://asic.gov.au", newsUrl: "https://asic.gov.au/about-asic/news-centre/find-a-media-release/" },
  ],
  "UK": [
    { name: "FCA", url: "https://www.fca.org.uk", newsUrl: "https://www.fca.org.uk/news/news-stories" },
    { name: "PRA", url: "https://www.bankofengland.co.uk/prudential-regulation" },
    { name: "NCA", url: "https://www.nationalcrimeagency.gov.uk" },
  ],
  "EU": [
    { name: "EBA", url: "https://www.eba.europa.eu", newsUrl: "https://www.eba.europa.eu/news-press/news" },
    { name: "ESMA", url: "https://www.esma.europa.eu", newsUrl: "https://www.esma.europa.eu/press-news/esma-news" },
    { name: "ECB", url: "https://www.ecb.europa.eu", newsUrl: "https://www.ecb.europa.eu/press/pr/html/index.en.html" },
  ],
  "US": [
    { name: "FinCEN", url: "https://www.fincen.gov", newsUrl: "https://www.fincen.gov/news-room" },
    { name: "OCC", url: "https://www.occ.gov", newsUrl: "https://www.occ.gov/news-issuances/index-news-issuances.html" },
    { name: "OFAC", url: "https://ofac.treasury.gov", newsUrl: "https://ofac.treasury.gov/recent-actions" },
    { name: "SEC", url: "https://www.sec.gov", newsUrl: "https://www.sec.gov/news/pressreleases" },
    { name: "Federal Reserve", url: "https://www.federalreserve.gov", newsUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm" },
  ],
  "Global": [
    { name: "FATF", url: "https://www.fatf-gafi.org", newsUrl: "https://www.fatf-gafi.org/en/publications.html" },
    { name: "BIS", url: "https://www.bis.org", newsUrl: "https://www.bis.org/press/index.htm" },
    { name: "FSB", url: "https://www.fsb.org", newsUrl: "https://www.fsb.org/press/" },
    { name: "IOSCO", url: "https://www.iosco.org", newsUrl: "https://www.iosco.org/news/" },
    { name: "BCBS", url: "https://www.bis.org/bcbs/", newsUrl: "https://www.bis.org/bcbs/publications.htm" },
  ],
};

export const DEFAULT_KEYWORDS = [
  "AML",
  "Anti-Money Laundering",
  "KYC",
  "Sanctions",
  "FATF",
  "Compliance",
  "Fines",
  "Penalties",
  "Enforcement",
  "Guidance",
  "Circular",
  "Press Release",
  "Regulatory Update",
  "Transaction Monitoring",
  "Risk Assessment",
  "Customer Due Diligence",
  "CDD",
  "EDD",
  "PEP",
  "Suspicious Activity",
  "SAR",
  "STR",
];

export const CADENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export type Cadence = typeof CADENCE_OPTIONS[number]["value"];
