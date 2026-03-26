import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertTriangle, Clock, CalendarDays, CalendarRange, FileText, Shield } from "lucide-react";
import RegTechLayout from "./layout";

interface DeadlineStats {
  overdue: number;
  dueThisWeek: number;
  dueThisMonth: number;
  dueThisQuarter: number;
  total: number;
}

interface Obligation {
  id: number;
  docId: number;
  area: string;
  actor: string | null;
  requirement: string;
  deadline: string;
  penalty: string | null;
  impactScore: string | null;
  docTitle: string;
  jurisdiction: string;
  regulator: string;
}

function getUrgencyGroup(deadline: string): "overdue" | "this_week" | "this_month" | "this_quarter" | "later" {
  const d = new Date(deadline);
  const now = new Date();
  if (d < now) return "overdue";
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  if (d <= endOfWeek) return "this_week";
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (d <= endOfMonth) return "this_month";
  const endOfQuarter = new Date(now.getFullYear(), Math.ceil((now.getMonth() + 1) / 3) * 3, 0);
  if (d <= endOfQuarter) return "this_quarter";
  return "later";
}

const urgencyConfig = {
  overdue: { label: "Overdue", color: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800", textColor: "text-red-700 dark:text-red-400", badgeColor: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
  this_week: { label: "Due This Week", color: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800", textColor: "text-amber-700 dark:text-amber-400", badgeColor: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  this_month: { label: "Due This Month", color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800", textColor: "text-blue-700 dark:text-blue-400", badgeColor: "bg-blue-100 text-blue-800 border-blue-200", icon: CalendarDays },
  this_quarter: { label: "Due This Quarter", color: "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700", textColor: "text-slate-700 dark:text-slate-300", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", icon: CalendarRange },
  later: { label: "Later", color: "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700", textColor: "text-slate-500 dark:text-slate-400", badgeColor: "bg-slate-50 text-slate-600 border-slate-200", icon: CalendarClock },
};

const areaColors: Record<string, string> = {
  KYC: "bg-blue-100 text-blue-800 border-blue-200",
  Sanctions: "bg-red-100 text-red-800 border-red-200",
  Reporting: "bg-violet-100 text-violet-800 border-violet-200",
  RecordKeeping: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Training: "bg-amber-100 text-amber-800 border-amber-200",
  AML: "bg-orange-100 text-orange-800 border-orange-200",
  Others: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `${diff} days`;
}

export default function DeadlinesPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DeadlineStats>({
    queryKey: ["/api/regtech/deadlines/stats"],
  });

  const { data: deadlines, isLoading: deadlinesLoading } = useQuery<Obligation[]>({
    queryKey: ["/api/regtech/deadlines"],
  });

  const grouped = (deadlines || []).reduce<Record<string, Obligation[]>>((acc, ob) => {
    const group = getUrgencyGroup(ob.deadline);
    if (!acc[group]) acc[group] = [];
    acc[group].push(ob);
    return acc;
  }, {});

  const statCards = [
    { label: "Overdue", value: stats?.overdue ?? 0, color: "bg-red-500", textColor: "text-red-600 dark:text-red-400", icon: AlertTriangle },
    { label: "Due This Week", value: stats?.dueThisWeek ?? 0, color: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400", icon: Clock },
    { label: "Due This Month", value: stats?.dueThisMonth ?? 0, color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400", icon: CalendarDays },
    { label: "Due This Quarter", value: stats?.dueThisQuarter ?? 0, color: "bg-slate-500", textColor: "text-slate-600 dark:text-slate-400", icon: CalendarRange },
  ];

  return (
    <RegTechLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Compliance Deadlines</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track regulatory obligation deadlines across your document library
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`h-8 w-8 rounded-lg ${card.color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className={`text-2xl font-bold font-mono ${card.textColor}`}>
                      {statsLoading ? "—" : card.value}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Timeline */}
        {deadlinesLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarClock className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-500">Loading deadlines...</p>
            </CardContent>
          </Card>
        ) : !deadlines || deadlines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarClock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 font-heading">No Deadlines Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Upload regulatory documents and run obligation analysis to populate compliance deadlines.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {(["overdue", "this_week", "this_month", "this_quarter", "later"] as const).map((group) => {
              const items = grouped[group];
              if (!items || items.length === 0) return null;
              const config = urgencyConfig[group];
              const GroupIcon = config.icon;

              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-3">
                    <GroupIcon className={`h-4 w-4 ${config.textColor}`} />
                    <h2 className={`text-sm font-semibold uppercase tracking-wide ${config.textColor}`}>
                      {config.label}
                    </h2>
                    <Badge variant="outline" className={`text-xs ${config.badgeColor}`}>
                      {items.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {items.map((ob) => (
                      <div
                        key={ob.id}
                        className={`p-4 rounded-xl border ${config.color} transition-colors`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 dark:text-white leading-relaxed">
                              {ob.requirement}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className={areaColors[ob.area] || areaColors.Others}>
                                {ob.area}
                              </Badge>
                              {ob.actor && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                                  <Shield className="h-3 w-3 mr-1" />{ob.actor}
                                </Badge>
                              )}
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {ob.regulator} · {ob.jurisdiction}
                              </span>
                            </div>
                            {ob.penalty && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                Penalty: {ob.penalty}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1 truncate" title={ob.docTitle}>
                              Source: {ob.docTitle}
                            </p>
                          </div>

                          {/* Deadline badge */}
                          <div className="flex-shrink-0 text-right">
                            <div className={`text-sm font-semibold font-mono ${config.textColor}`}>
                              {formatDate(ob.deadline)}
                            </div>
                            <div className={`text-xs ${config.textColor} opacity-70`}>
                              {daysUntil(ob.deadline)}
                            </div>
                            {ob.impactScore && (
                              <div className="mt-1">
                                <span className="text-[10px] text-slate-400">Impact: </span>
                                <span className="text-[10px] font-mono font-medium text-[#D4AF37]">
                                  {parseFloat(ob.impactScore).toFixed(1)}/10
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center mt-4">
          RegIntel can make mistakes. Please verify all important information before taking decisions.
        </p>
      </div>
    </RegTechLayout>
  );
}
