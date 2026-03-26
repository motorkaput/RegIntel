import RegTechLayout from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  HelpCircle,
  Library,
  FileText,
  MessageSquare,
  GitCompare,
  ClipboardCheck,
  Bell,
  History,
  Target,
  Users,
  Gauge,
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Upload,
  Search,
  BarChart3,
} from "lucide-react";

function SectionCard({ icon: Icon, iconColor, title, children }: { icon: any; iconColor: string; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700 leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}

function KeyPoint({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 bg-slate-50 rounded-lg">
      <Icon className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
      <div>
        <span className="font-medium text-slate-800">{label}: </span>
        {children}
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <RegTechLayout>
      <div className="space-y-6 max-w-4xl page-enter">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-600" />
            How It Works
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Understand how RegIntel AI Engine processes your documents and generates insights
          </p>
        </div>

        <Card className="border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-700">
                <p className="font-medium text-indigo-800 mb-1">Important Note</p>
                <p>
                  RegIntel AI Engine uses advanced AI models to extract, analyse, and interpret regulatory documents. 
                  All AI-generated outputs — including confidence scores, role-based actions, priority levels, and impact scores — 
                  are <span className="font-medium">decision-support tools designed to help prioritise and organise compliance work</span>. 
                  They are not direct regulatory determinations and should always be reviewed with professional judgement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Understanding AI-Generated Scores
          </h2>
          <div className="space-y-4">

            <SectionCard icon={Target} iconColor="text-amber-600" title="Confidence Score (Obligations Analysis)">
              <p>
                The confidence score reflects <span className="font-medium">how clearly and explicitly an obligation is stated in the source document</span>. 
                It does not represent the accuracy of the regulation itself.
              </p>
              <div className="space-y-2">
                <KeyPoint icon={CheckCircle2} label="High confidence (80-100%)">
                  The regulation states the obligation directly and unambiguously. 
                  For example: <em>"All licensed entities must file STRs within 10 business days"</em>
                </KeyPoint>
                <KeyPoint icon={AlertTriangle} label="Medium confidence (50-79%)">
                  The obligation is present but the language is somewhat broad or requires interpretation. 
                  For example: <em>"Entities are expected to implement appropriate monitoring measures"</em>
                </KeyPoint>
                <KeyPoint icon={Search} label="Low confidence (below 50%)">
                  The obligation is inferred or the language is vague. These items warrant closer human review. 
                  For example: <em>"Entities should consider relevant best practices"</em>
                </KeyPoint>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-slate-600">
                <span className="font-medium text-amber-800">In practice:</span> Use confidence scores to prioritise your review — start with lower confidence items that may need expert interpretation, while higher confidence items can typically be actioned more directly.
              </div>
            </SectionCard>

            <SectionCard icon={Users} iconColor="text-blue-600" title="Role-Based Actions & Priority Levels">
              <p>
                Regulators typically do not specify which internal roles should carry out each obligation. 
                <span className="font-medium"> The role-based actions are AI-generated recommendations</span>, not direct extracts from the regulatory text.
              </p>
              <p>
                The AI engine takes each identified obligation and uses its knowledge of typical compliance organisational structures 
                to suggest which roles (MLRO, CCO, Compliance Analyst, etc.) would likely need to act on it, and what those actions might involve.
              </p>
              <div className="space-y-2 mt-2">
                <p className="font-medium text-slate-800">How priority levels are assigned:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <Badge variant="destructive" className="mb-2">High</Badge>
                    <p className="text-xs text-slate-600">Obligations related to sanctions screening, suspicious transaction reporting, KYC requirements, or those with specific deadlines and penalties</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <Badge className="mb-2 bg-yellow-500">Medium</Badge>
                    <p className="text-xs text-slate-600">Governance requirements, policy updates, training mandates, or periodic review obligations</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <Badge className="mb-2 bg-green-500">Low</Badge>
                    <p className="text-xs text-slate-600">General guidance, best practice recommendations, or obligations without specific timelines</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-slate-600">
                <span className="font-medium text-blue-800">In practice:</span> These should be treated as starting points for internal discussion, not as definitive assignments. Each organisation should review and adjust based on its own structure, risk appetite, and operating model.
              </div>
            </SectionCard>

            <SectionCard icon={Gauge} iconColor="text-cyan-600" title="Impact Score (Document Diff)">
              <p>
                When comparing two versions of a regulatory document, the AI engine assigns an <span className="font-medium">impact score from 1 to 10</span> representing 
                the overall regulatory significance of the changes between the versions.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="w-6 h-6 rounded bg-green-100 border border-green-300 flex items-center justify-center text-xs font-medium text-green-700">{n}</div>
                    ))}
                  </div>
                  <div>
                    <span className="font-medium text-slate-800">Minor changes</span>
                    <span className="text-slate-600"> — clarifications, formatting, editorial corrections</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex gap-1">
                    {[4, 5, 6].map(n => (
                      <div key={n} className="w-6 h-6 rounded bg-yellow-100 border border-yellow-300 flex items-center justify-center text-xs font-medium text-yellow-700">{n}</div>
                    ))}
                  </div>
                  <div>
                    <span className="font-medium text-slate-800">Moderate changes</span>
                    <span className="text-slate-600"> — new requirements or adjustments to existing ones</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex gap-1">
                    {[7, 8, 9, 10].map(n => (
                      <div key={n} className="w-6 h-6 rounded bg-red-100 border border-red-300 flex items-center justify-center text-xs font-medium text-red-700">{n}</div>
                    ))}
                  </div>
                  <div>
                    <span className="font-medium text-slate-800">Major changes</span>
                    <span className="text-slate-600"> — significant new requirements, structural changes, substantial new compliance obligations</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100 text-slate-600">
                <span className="font-medium text-cyan-800">In practice:</span> The impact score helps compliance teams quickly triage document updates. High-impact changes should be reviewed promptly, while low-impact changes can be addressed in regular review cycles.
              </div>
            </SectionCard>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-indigo-500" />
            Feature Guide
          </h2>
          <div className="space-y-4">

            <SectionCard icon={Library} iconColor="text-blue-600" title="Library">
              <p>Your centralised repository for all regulatory documents.</p>
              <div className="space-y-2">
                <KeyPoint icon={Upload} label="Upload documents">
                  Upload PDF, DOCX, or image files (up to 10MB). The AI engine automatically extracts text using Mistral OCR 3 for high-accuracy parsing.
                </KeyPoint>
                <KeyPoint icon={FileText} label="Document metadata">
                  Each document is automatically classified by type (legislation, guidance, circular, etc.) and you can tag it with jurisdiction and regulator for better organisation.
                </KeyPoint>
                <KeyPoint icon={Search} label="Browse and search">
                  Filter your library by jurisdiction, regulator, or document type. Use the search to quickly find specific documents.
                </KeyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={FileText} iconColor="text-violet-600" title="Console (URL-Based Analysis)">
              <p>Analyze regulatory content directly from official source URLs.</p>
              <div className="space-y-2">
                <KeyPoint icon={Search} label="URL analysis">
                  Paste a URL from any regulatory website and the AI engine will extract and analyze the content, identifying key regulatory updates, requirements, and implications.
                </KeyPoint>
                <KeyPoint icon={BarChart3} label="Analysis">
                  Each scanned result includes a summary, source URL for verification, and relevance assessment to help you decide what requires attention.
                </KeyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={MessageSquare} iconColor="text-orange-600" title="Query AI">
              <p>Ask natural language questions about your uploaded regulatory documents.</p>
              <div className="space-y-2">
                <KeyPoint icon={Search} label="How it works">
                  Select one or more documents, optionally filter by jurisdiction or regulator, and type your question in plain language. 
                  The AI engine searches through the selected documents to find relevant answers.
                </KeyPoint>
                <KeyPoint icon={CheckCircle2} label="Best results">
                  Be specific in your questions. For example, instead of "What are the requirements?", 
                  try "What are the KYC requirements for correspondent banking relationships under this regulation?"
                </KeyPoint>
                <KeyPoint icon={FileText} label="Export">
                  Results can be exported as Word documents for sharing with your team or for compliance records.
                </KeyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={GitCompare} iconColor="text-cyan-600" title="Document Diff">
              <p>Compare two versions of a regulatory document to identify what has changed.</p>
              <div className="space-y-2">
                <KeyPoint icon={Search} label="How it works">
                  Select an older version and a newer version of a regulation. The AI engine analyses both documents and identifies sections that were added, removed, or amended.
                </KeyPoint>
                <KeyPoint icon={Gauge} label="Impact assessment">
                  Each comparison includes an impact score (1-10), key changes summary, and actionable compliance impact guidance. See the "Impact Score" section above for details.
                </KeyPoint>
                <KeyPoint icon={FileText} label="Export">
                  Diff results can be exported as Word documents for record-keeping and team review.
                </KeyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={ClipboardCheck} iconColor="text-amber-600" title="Obligations Analysis">
              <p>AI-powered extraction and analysis of regulatory obligations from your documents.</p>
              <div className="space-y-2">
                <KeyPoint icon={Search} label="How it works">
                  Select one or more regulatory documents and the AI engine will identify specific compliance obligations, 
                  categorised by area (Governance, Screening, Reporting, etc.).
                </KeyPoint>
                <KeyPoint icon={Users} label="Role-based actions">
                  Each obligation includes suggested actions for different compliance roles (MLRO, CCO, Compliance Analyst, etc.). 
                  See the "Role-Based Actions" section above for how these are determined.
                </KeyPoint>
                <KeyPoint icon={Target} label="Confidence & traceability">
                  Every obligation includes a confidence score and traceable reference back to the source document section. 
                  See the "Confidence Score" section above for interpretation guidance.
                </KeyPoint>
                <KeyPoint icon={FileText} label="Export">
                  Full obligation analysis results can be exported as Word documents.
                </KeyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={Bell} iconColor="text-rose-600" title="Proactive Alerts">
              <p>Automated notifications when regulatory changes are detected that may affect your organisation.</p>
              <div className="space-y-2">
                <KeyPoint icon={AlertTriangle} label="Alert triggers">
                  Alerts are generated when new documents are uploaded or when document comparisons reveal significant changes. 
                  Each alert includes the impact score and recommended action items.
                </KeyPoint>
                <KeyPoint icon={CheckCircle2} label="Managing alerts">
                  Review and dismiss alerts as you address them. Alerts are linked to the source document or diff for easy reference.
                </KeyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={History} iconColor="text-emerald-600" title="Sessions">
              <p>A complete history of your interactions with the platform.</p>
              <div className="space-y-2">
                <KeyPoint icon={Search} label="Session history">
                  Every query, analysis, and diff you perform is saved as a session. Return to any previous session to review the results without re-running the analysis.
                </KeyPoint>
                <KeyPoint icon={FileText} label="Continuity">
                  Sessions preserve the full context of your work, making it easy to pick up where you left off or share findings with colleagues.
                </KeyPoint>
              </div>
            </SectionCard>

          </div>
        </div>

        <Separator />

        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Lightbulb className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-700 mb-1">Tips for Best Results</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Upload clear, high-quality documents for the most accurate text extraction</li>
                  <li>Tag documents with the correct jurisdiction and regulator for better filtering and analysis</li>
                  <li>When querying, be specific about the regulatory area or requirement you are investigating</li>
                  <li>Use the Obligations Analysis feature after uploading a new regulation to quickly understand your compliance requirements</li>
                  <li>Review AI-generated role assignments and priorities against your organisation's actual structure and risk framework</li>
                  <li>Export results as Word documents to share with team members who may not have platform access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </RegTechLayout>
  );
}
