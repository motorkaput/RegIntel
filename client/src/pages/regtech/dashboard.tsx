import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  FileText,
  Scale,
  Shield,
  Link2,
  TrendingUp,
  Building2
} from "lucide-react";
import RegTechLayout from "./layout";

interface DashboardStats {
  regulations: {
    total: number;
    byJurisdiction: Record<string, number>;
  };
  obligations: {
    total: number;
    byStatus: {
      unreviewed: number;
      approved: number;
      needs_edit: number;
    };
    byModality: Record<string, number>;
  };
  mappings: {
    total: number;
    withControls: number;
    withEvidence: number;
    verified: number;
  };
  controls: {
    total: number;
  };
  evidence: {
    total: number;
  };
  coverage: {
    obligationsWithMappings: number;
    obligationsWithoutMappings: number;
    coveragePercent: number;
  };
}

const JURISDICTION_COLORS: Record<string, string> = {
  UK: "bg-blue-100 text-blue-800",
  IN: "bg-orange-100 text-orange-800",
  SG: "bg-red-100 text-red-800",
  AU: "bg-green-100 text-green-800",
  US: "bg-purple-100 text-purple-800",
  EU: "bg-indigo-100 text-indigo-800"
};

export default function ComplianceDashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/regtech/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <RegTechLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </RegTechLayout>
    );
  }

  if (!stats) {
    return (
      <RegTechLayout>
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Unable to load dashboard data.</p>
          </CardContent>
        </Card>
      </RegTechLayout>
    );
  }

  return (
    <RegTechLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-indigo-500" />
              Compliance Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Overview of regulatory compliance status and coverage
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Regulations</p>
                  <p className="text-2xl font-bold">{stats.regulations.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Obligations</p>
                  <p className="text-2xl font-bold">{stats.obligations.total}</p>
                </div>
                <Scale className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Controls</p>
                  <p className="text-2xl font-bold">{stats.controls.total}</p>
                </div>
                <Shield className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Mappings</p>
                  <p className="text-2xl font-bold">{stats.mappings.total}</p>
                </div>
                <Link2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Compliance Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Coverage</span>
                  <span className="text-lg font-bold">{stats.coverage.coveragePercent}%</span>
                </div>
                <Progress value={stats.coverage.coveragePercent} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Mapped</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {stats.coverage.obligationsWithMappings}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Gaps</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {stats.coverage.obligationsWithoutMappings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-500" />
                Obligation Review Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{stats.obligations.byStatus.approved}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {stats.obligations.total > 0 
                        ? Math.round((stats.obligations.byStatus.approved / stats.obligations.total) * 100) 
                        : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Needs Edit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{stats.obligations.byStatus.needs_edit}</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {stats.obligations.total > 0 
                        ? Math.round((stats.obligations.byStatus.needs_edit / stats.obligations.total) * 100) 
                        : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Unreviewed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{stats.obligations.byStatus.unreviewed}</span>
                    <Badge className="bg-gray-100 text-gray-800">
                      {stats.obligations.total > 0 
                        ? Math.round((stats.obligations.byStatus.unreviewed / stats.obligations.total) * 100) 
                        : 0}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Regulations by Jurisdiction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.regulations.byJurisdiction).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No regulations yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.regulations.byJurisdiction).map(([jurisdiction, count]) => (
                    <Badge 
                      key={jurisdiction} 
                      className={JURISDICTION_COLORS[jurisdiction] || "bg-gray-100 text-gray-800"}
                    >
                      {jurisdiction}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-5 w-5 text-purple-500" />
                Mapping Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">With Controls</span>
                  <span className="font-bold">{stats.mappings.withControls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">With Evidence</span>
                  <span className="font-bold">{stats.mappings.withEvidence}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Human Verified</span>
                  </div>
                  <span className="font-bold">{stats.mappings.verified}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-500" />
              Obligations by Modality
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.obligations.byModality).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No obligations extracted yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(stats.obligations.byModality).map(([modality, count]) => (
                  <div key={modality} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-gray-500 uppercase">{modality}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RegTechLayout>
  );
}
