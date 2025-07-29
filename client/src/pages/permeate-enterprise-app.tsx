import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  Users,
  BarChart3,
  CheckCircle,
  Circle,
  User,
  LogOut,
  Settings,
  TrendingUp
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import permeateIcon from "@assets/PerMeaTeEnterprise_Icon_1752664675820.png";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

// AI Analytics Component
function AIAnalyticsTab({ goals, company, employees }: { goals: Goal[], company: Company | null, employees: Employee[] }) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const generateAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/permeate/analyze-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalsData: goals,
          projectsData: goals.flatMap(g => g.projects),
          tasksData: goals.flatMap(g => g.projects).flatMap(p => p.tasks)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Analytics generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (goals.length > 0) {
      generateAnalytics();
    }
  }, [goals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI-Powered Performance Analytics</h2>
        <Button onClick={generateAnalytics} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>
      
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-gray-600 mt-4">OpenAI is analyzing your organizational performance...</p>
          </CardContent>
        </Card>
      )}
      
      {analyticsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Overall Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {analyticsData.overallScore}/100
                </div>
                <p className="text-sm text-gray-600">AI-calculated performance rating</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Goals Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {goals.filter(g => g.status === 'completed').length}/{goals.length}
                </div>
                <p className="text-sm text-gray-600">
                  {goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Risk Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {analyticsData.riskAreas?.length || 0}
                </div>
                <p className="text-sm text-gray-600">Areas needing attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-900">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.insights?.map((insight: string, index: number) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-900">AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recommendations?.map((rec: string, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {analyticsData.topPerformers?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-900">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analyticsData.topPerformers.map((performer: string, index: number) => (
                    <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                      <p className="text-sm font-medium text-purple-800">{performer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analyticsData.riskAreas?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">Risk Areas & Improvement Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.riskAreas.map((risk: string, index: number) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{risk}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {!analyticsData && !isLoading && goals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Create some goals to see AI-powered analytics</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface Company {
  id: string;
  name: string;
  businessAreas: string[];
  numberOfEmployees: number;
  locations: string[];
  isSetup: boolean;
}

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  alias: string; // email
  location: string;
  role: string;
  reportingTo?: string;
  keySkills: string[];
  userType: 'administrator' | 'project_leader' | 'team_member' | 'organization_leader';
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  targetDate?: string;
  progress: number;
  projects: Project[];
  createdBy: string;
}

interface Project {
  id: string;
  goalId: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  progress: number;
  tasks: Task[];
  createdBy: string;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  score: number;
  dueDate?: string;
  selfScore?: number;
}

export default function PerMeaTeEnterpriseApp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check beta authentication
  useEffect(() => {
    const betaAuth = sessionStorage.getItem("perMeateBetaAuth");
    if (!betaAuth) {
      setLocation("/permeate-beta-login");
    }
  }, [setLocation]);

  // User type and company setup state
  const [currentUser, setCurrentUser] = useState<Employee>(() => {
    const savedUser = sessionStorage.getItem("perMeateCurrentUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      return {
        id: userData.employeeId,
        employeeId: userData.employeeId,
        name: userData.name,
        alias: `${userData.name.toLowerCase().replace(' ', '.')}@company.com`,
        location: 'New York, USA',
        role: userData.userType === 'administrator' ? 'System Administrator' :
              userData.userType === 'project_leader' ? 'Project Manager' :
              userData.userType === 'team_member' ? 'Software Developer' : 'CEO',
        keySkills: userData.userType === 'administrator' ? ['System Setup', 'User Management'] :
                   userData.userType === 'project_leader' ? ['Project Management', 'Leadership'] :
                   userData.userType === 'team_member' ? ['React', 'TypeScript', 'Node.js'] : ['Strategic Planning', 'Leadership'],
        userType: userData.userType
      };
    }
    
    // Default to administrator if no saved user
    return {
      id: '1',
      employeeId: 'ADM001',
      name: 'Administrator User',
      alias: 'admin@company.com',
      location: 'New York, USA',
      role: 'System Administrator',
      keySkills: ['System Setup', 'User Management'],
      userType: 'administrator'
    };
  });

  const [company, setCompany] = useState<Company | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Onboarding form states
  const [companyName, setCompanyName] = useState("");
  const [businessAreas, setBusinessAreas] = useState("");
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [locations, setLocations] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'projects' | 'analytics' | 'users'>('overview');
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);

  // Session management
  const handleLogout = () => {
    sessionStorage.removeItem("perMeateBetaAuth");
    setLocation("/permeate-enterprise");
  };

  const handleRefreshSession = () => {
    window.location.reload();
  };

  // Check if company is set up
  useEffect(() => {
    const savedCompany = localStorage.getItem('permeate_company');
    if (savedCompany) {
      const companyData = JSON.parse(savedCompany);
      setCompany(companyData);
      setShowOnboarding(!companyData.isSetup);
    }
  }, []);

  // Sample data after setup
  const [goals, setGoals] = useState<Goal[]>([]);

  // Onboarding functions
  const handleCompanySetup = () => {
    if (!companyName || !businessAreas || !numberOfEmployees || !locations) {
      toast({
        title: "Missing Information",
        description: "Please fill in all company details",
        variant: "destructive",
      });
      return;
    }

    const newCompany: Company = {
      id: Date.now().toString(),
      name: companyName,
      businessAreas: businessAreas.split(',').map(area => area.trim()),
      numberOfEmployees: parseInt(numberOfEmployees),
      locations: locations.split(',').map(loc => loc.trim()),
      isSetup: false
    };

    setCompany(newCompany);
    setOnboardingStep(2);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setCsvFile(file);
      
      try {
        // Read file content
        const fileContent = await file.text();
        
        // Call OpenAI analysis API
        const response = await fetch('/api/permeate/analyze-csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvContent: fileContent })
        });

        if (!response.ok) {
          throw new Error('Failed to analyze CSV');
        }

        const { employees: analyzedEmployees, insights } = await response.json();
        
        // Store the AI-analyzed employees
        setEmployees(analyzedEmployees);
        localStorage.setItem('permeate_org_insights', JSON.stringify(insights));
        
        setOnboardingStep(3);
        
        toast({
          title: "Analysis Complete",
          description: `Analyzed ${analyzedEmployees.length} employees with AI insights`,
        });
      } catch (error) {
        console.error('CSV analysis error:', error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
    }
  };

  const completeOnboarding = () => {
    if (company) {
      const completedCompany = { ...company, isSetup: true };
      setCompany(completedCompany);
      localStorage.setItem('permeate_company', JSON.stringify(completedCompany));
      localStorage.setItem('permeate_employees', JSON.stringify(employees));
      setShowOnboarding(false);
      
      toast({
        title: "Setup Complete",
        description: "Welcome to PerMeaTe Enterprise!",
      });
    }
  };

  const createGoal = async () => {
    if (!newGoalTitle.trim()) return;
    
    try {
      // Generate AI-powered goal breakdown
      const response = await fetch('/api/permeate/generate-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalTitle: newGoalTitle,
          goalDescription: newGoalDescription,
          companyContext: `Company: ${company?.name}, Business Areas: ${company?.businessAreas.join(', ')}, Employees: ${company?.numberOfEmployees}`
        })
      });

      const breakdown = await response.json();
      
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: newGoalTitle,
        description: newGoalDescription,
        status: 'active',
        createdAt: new Date().toISOString(),
        progress: 0,
        projects: breakdown.projects?.map((project: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          goalId: Date.now().toString(),
          title: project.title,
          description: project.description,
          status: 'planning' as const,
          progress: 0,
          tasks: project.tasks?.map((task: any, taskIndex: number) => ({
            id: `${Date.now()}-${index}-${taskIndex}`,
            projectId: `${Date.now()}-${index}`,
            title: task.title,
            description: task.description,
            status: 'todo' as const,
            priority: task.priority,
            score: 0,
            dueDate: task.estimatedDays ? new Date(Date.now() + task.estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
          })) || [],
          createdBy: currentUser.employeeId
        })) || [],
        createdBy: currentUser.employeeId
      };

      setGoals([...goals, newGoal]);
      setNewGoalTitle("");
      setNewGoalDescription("");
      setShowNewGoalForm(false);
      
      toast({
        title: "AI-Powered Goal Created",
        description: `Generated ${breakdown.projects?.length || 0} projects with detailed tasks using OpenAI analysis.`,
      });
    } catch (error) {
      console.error('Goal creation error:', error);
      // Fallback to basic goal creation
      const basicGoal: Goal = {
        id: Date.now().toString(),
        title: newGoalTitle,
        description: newGoalDescription,
        status: 'active',
        createdAt: new Date().toISOString(),
        progress: 0,
        projects: [],
        createdBy: currentUser.employeeId
      };
      
      setGoals([...goals, basicGoal]);
      setNewGoalTitle("");
      setNewGoalDescription("");
      setShowNewGoalForm(false);
      
      toast({
        title: "Goal Created",
        description: "Goal created successfully (AI breakdown unavailable).",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Onboarding Wizard Component
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-surface-white">
        <Navbar />
        
        <main className="pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PerMeaTe Enterprise</h1>
              <p className="text-gray-600">Let's set up your organization to get started</p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      onboardingStep >= step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-1 mx-2 ${
                        onboardingStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">
                  {onboardingStep === 1 && "Company Information"}
                  {onboardingStep === 2 && "Employee Data Upload"}
                  {onboardingStep === 3 && "Review & Complete Setup"}
                </CardTitle>
                <CardDescription>
                  {onboardingStep === 1 && "Tell us about your organization"}
                  {onboardingStep === 2 && "Upload your employee information"}
                  {onboardingStep === 3 && "Review the imported data"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Step 1: Company Information */}
                {onboardingStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g., Acme Corporation"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Areas * (comma-separated)
                      </label>
                      <Input
                        value={businessAreas}
                        onChange={(e) => setBusinessAreas(e.target.value)}
                        placeholder="e.g., Technology, Marketing, Sales, Operations"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Employees *
                      </label>
                      <Input
                        type="number"
                        value={numberOfEmployees}
                        onChange={(e) => setNumberOfEmployees(e.target.value)}
                        placeholder="e.g., 150"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Locations * (comma-separated)
                      </label>
                      <Input
                        value={locations}
                        onChange={(e) => setLocations(e.target.value)}
                        placeholder="e.g., New York USA, London UK, Tokyo Japan"
                        className="w-full"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleCompanySetup}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Continue to Employee Upload
                    </Button>
                  </div>
                )}

                {/* Step 2: Employee Data Upload */}
                {onboardingStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Required CSV/Excel Columns:</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Employee ID Number (unique identifier)</li>
                        <li>• Employee Name</li>
                        <li>• Employee Alias (email)</li>
                        <li>• Location (city, country)</li>
                        <li>• Role</li>
                        <li>• Reporting Relationship (Employee ID of manager)</li>
                        <li>• Key Skills (comma-separated)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Employee List (CSV or Excel)
                      </label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {csvFile && (
                        <p className="text-sm text-green-600 mt-2">
                          File uploaded: {csvFile.name} - Processing...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={() => setOnboardingStep(1)}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Complete */}
                {onboardingStep === 3 && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">✓ Employee Data Processed Successfully</h3>
                      <p className="text-sm text-green-800">
                        Found {employees.length} employees in your organization
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Company Summary:</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p><span className="font-medium">Name:</span> {company?.name}</p>
                        <p><span className="font-medium">Business Areas:</span> {company?.businessAreas.join(', ')}</p>
                        <p><span className="font-medium">Employees:</span> {company?.numberOfEmployees}</p>
                        <p><span className="font-medium">Locations:</span> {company?.locations.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Sample Employees:</h4>
                      <div className="space-y-2">
                        {employees.slice(0, 3).map((emp) => (
                          <div key={emp.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{emp.name}</p>
                                <p className="text-sm text-gray-600">{emp.role} • {emp.location}</p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                {emp.userType.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={() => setOnboardingStep(2)}
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={completeOnboarding}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Complete Setup
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      {/* PerMeaTe Enterprise Header */}
<div className="sticky top-24 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">PerMeaTe Enterprise</h1>
                <p className="text-sm text-gray-500">Performance Measurement & Optimization</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">EnterpriseUser</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'goals', label: 'Goals', icon: Target },
              { id: 'projects', label: 'Projects', icon: Settings },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'users', label: 'Users', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900">Active Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{goals.filter(g => g.status === 'active').length}</div>
                  <p className="text-sm text-gray-500">Total goals in progress</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900">Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {goals.reduce((acc, goal) => acc + goal.projects.length, 0)}
                  </div>
                  <p className="text-sm text-gray-500">Active projects</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900">Average Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {goals.length > 0 ? Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length) : 0}%
                  </div>
                  <p className="text-sm text-gray-500">Across all goals</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Recent Goals</CardTitle>
                <CardDescription>Your latest organizational objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{goal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">{goal.progress}% complete</span>
                        </div>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2 ml-4">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Goals Management</h2>
              <Button 
                onClick={() => setShowNewGoalForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </div>

            {/* New Goal Form */}
            {showNewGoalForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900">Create New Goal</CardTitle>
                  <CardDescription>Define a new organizational objective</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Title
                    </label>
                    <Input
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      placeholder="e.g., Increase customer satisfaction by 20%"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={newGoalDescription}
                      onChange={(e) => setNewGoalDescription(e.target.value)}
                      placeholder="Describe the goal and success criteria..."
                      className="w-full"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button onClick={createGoal} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Create Goal
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewGoalForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Goals List */}
            <div className="space-y-4">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-gray-900">{goal.title}</CardTitle>
                        <CardDescription className="mt-2">{goal.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      
                      {goal.projects.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Projects ({goal.projects.length})</h4>
                          <div className="space-y-2">
                            {goal.projects.map((project) => (
                              <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{project.title}</span>
                                  <p className="text-xs text-gray-600">{project.description}</p>
                                </div>
                                <Badge className={getStatusColor(project.status)}>
                                  {project.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
            
            <div className="space-y-4">
              {goals.flatMap(goal => goal.projects).map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-gray-900">{project.title}</CardTitle>
                        <CardDescription className="mt-2">{project.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      
                      {project.tasks.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Tasks ({project.tasks.length})</h4>
                          <div className="space-y-2">
                            {project.tasks.map((task) => (
                              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {task.status === 'completed' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-400" />
                                  )}
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                                    <p className="text-xs text-gray-600">{task.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-500">Score: {task.score}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="text-sm text-gray-600">
                {employees.length} employees • {company?.name}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {employees.filter(e => e.userType === 'administrator').length}
                  </div>
                  <p className="text-sm text-gray-600">Administrators</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {employees.filter(e => e.userType === 'project_leader').length}
                  </div>
                  <p className="text-sm text-gray-600">Project Leaders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {employees.filter(e => e.userType === 'team_member').length}
                  </div>
                  <p className="text-sm text-gray-600">Team Members</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {employees.filter(e => e.userType === 'organization_leader').length}
                  </div>
                  <p className="text-sm text-gray-600">Org Leaders</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              {employees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{employee.name}</h3>
                          <p className="text-sm text-gray-600">{employee.role} • {employee.location}</p>
                          <p className="text-xs text-gray-500">{employee.alias}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={
                          employee.userType === 'administrator' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          employee.userType === 'project_leader' ? 'bg-green-100 text-green-800 border-green-200' :
                          employee.userType === 'team_member' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          'bg-orange-100 text-orange-800 border-orange-200'
                        }>
                          {employee.userType.replace('_', ' ')}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">ID: {employee.employeeId}</p>
                          <p className="text-xs text-gray-500">
                            Skills: {employee.keySkills.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AIAnalyticsTab goals={goals} company={company} employees={employees} />
        )}
      </main>
      
      <Footer />
    </div>
  );
}