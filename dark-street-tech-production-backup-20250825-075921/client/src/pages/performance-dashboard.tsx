import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, FileText, Clock, Target, BarChart3, Activity, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";

interface Analytics {
  overview: {
    totalDocuments: number;
    documentsThisMonth: number;
    averageProcessingTime: number;
    averageAccuracyScore: number;
  };
  charts: {
    documentsByDay: any[];
    processingTimeChart: any[];
    accuracyTrend: any[];
    documentTypes: any[];
  };
  recentActivity: any[];
}

const COLORS = ['#00FF88', '#00FFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

export default function PerformanceDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics/dashboard'],
    retry: false,
  });

  if (isLoading || analyticsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Performance <span className="text-neon-green">Dashboard</span>
            </h1>
            <p className="text-xl text-gray-300">
              Track your document processing performance and analytics in real-time.
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-dark-gray border-neon-green/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Documents</p>
                    <p className="text-2xl font-bold text-neon-green">
                      {analytics?.overview.totalDocuments || 0}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-neon-green" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-gray border-neon-green/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">This Month</p>
                    <p className="text-2xl font-bold text-neon-green">
                      {analytics?.overview.documentsThisMonth || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-neon-green" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-gray border-neon-green/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Processing Time</p>
                    <p className="text-2xl font-bold text-neon-green">
                      {analytics?.overview.averageProcessingTime || 0}s
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-neon-green" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-gray border-neon-green/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-neon-green">
                      {analytics?.overview.averageAccuracyScore || 0}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-neon-green" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="charts">Analytics Charts</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Documents by Day Chart */}
                <Card className="bg-dark-gray border-neon-green/20">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Documents by Day (Last 30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics?.charts.documentsByDay || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #00FF88',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="#00FF88" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Processing Time Chart */}
                <Card className="bg-dark-gray border-neon-green/20">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Processing Time Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics?.charts.processingTimeChart || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="index" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #00FF88',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="time" stroke="#00FFFF" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Accuracy Trend */}
                <Card className="bg-dark-gray border-neon-green/20">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Accuracy Score Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics?.charts.accuracyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="index" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #00FF88',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#00FF88" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Document Types */}
                <Card className="bg-dark-gray border-neon-green/20">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Document Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics?.charts.documentTypes || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, percentage }) => `${type} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics?.charts.documentTypes?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #00FF88',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card className="bg-dark-gray border-neon-green/20">
                <CardHeader>
                  <CardTitle className="text-neon-green flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.recentActivity?.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No recent activity</p>
                    ) : (
                      analytics?.recentActivity?.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-darker-gray rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-neon-green" />
                            <div>
                              <p className="font-medium">{activity.name}</p>
                              <p className="text-sm text-gray-400">
                                {new Date(activity.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                              {activity.status}
                            </Badge>
                            {activity.score && (
                              <span className="text-neon-green font-semibold">
                                {activity.score}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-dark-gray border-neon-green/20">
                  <CardHeader>
                    <CardTitle className="text-neon-green">Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="w-5 h-5 text-neon-green mt-1" />
                        <div>
                          <p className="font-medium">Processing Speed</p>
                          <p className="text-sm text-gray-400">
                            Your documents are being processed {analytics?.overview.averageProcessingTime || 0}s faster than average
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Target className="w-5 h-5 text-neon-green mt-1" />
                        <div>
                          <p className="font-medium">Accuracy Score</p>
                          <p className="text-sm text-gray-400">
                            Maintaining {analytics?.overview.averageAccuracyScore || 0}% accuracy across all documents
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <BarChart3 className="w-5 h-5 text-neon-green mt-1" />
                        <div>
                          <p className="font-medium">Monthly Growth</p>
                          <p className="text-sm text-gray-400">
                            {analytics?.overview.documentsThisMonth || 0} documents processed this month
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-gray border-neon-green/20">
                  <CardHeader>
                    <CardTitle className="text-neon-green">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-darker-gray rounded-lg">
                        <p className="font-medium text-neon-green">Optimize Document Quality</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Consider preprocessing documents to improve accuracy scores
                        </p>
                      </div>
                      <div className="p-4 bg-darker-gray rounded-lg">
                        <p className="font-medium text-neon-green">Batch Processing</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Upload multiple documents at once for better efficiency
                        </p>
                      </div>
                      <div className="p-4 bg-darker-gray rounded-lg">
                        <p className="font-medium text-neon-green">Upgrade Plan</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Consider upgrading for advanced AI features and higher limits
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
