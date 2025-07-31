import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  TrendingUp,
  RefreshCcw,
  Upload,
  Download,
  Eye,
  Edit,
  Trash,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  X,
  Star,
  ArrowRight,
  FileText
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import permeateIcon from "@assets/PerMeaTeEnterprise_Icon_1752664675820.png";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

// Types
interface Company {
  id: string;
  name: string;
  businessAreas: string[];
  employeeCount: number;
  locations: string[];
  isOnboarded: boolean;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  skills: string[];
  location?: string;
  managerEmail?: string;
  permeateRole: 'organization_leader' | 'project_leader' | 'team_member' | 'administrator';
  isActive: boolean;
  hasPassword: boolean;
  lastLogin?: Date;
  companyId: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  createdBy: string;
  assignedTo: string[];
  projects: Project[];
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  createdBy: string;
  assignedTo: string[];
  projectLeader?: string;
  tasks: Task[];
  goalId: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'rejected';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  selfScore?: number;
  dueDate?: Date;
  createdBy: string;
  assignedTo?: string;
  approvedBy?: string;
  statusNotes?: string;
  externalIntegration?: any;
}

interface TaskUpdate {
  id: string;
  taskId: string;
  employeeId: string;
  status: string;
  score?: number;
  notes?: string;
  attachments?: any;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalNotes?: string;
  createdAt: Date;
}

interface AnalyzedEmployee {
  id: string;
  employeeId: string;
  name: string;
  alias: string;
  location: string;
  role: string;
  reportingTo?: string;
  keySkills: string[];
  userType: 'administrator' | 'project_leader' | 'team_member' | 'organization_leader';
  department?: string;
  seniority?: string;
  workload?: number;
}

export default function PerMeaTeEnhanced() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Authentication state
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    businessAreas: '',
    employeeCount: '',
    locations: ''
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [employeeData, setEmployeeData] = useState<AnalyzedEmployee[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [passwordsGenerated, setPasswordsGenerated] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<any[]>([]);
  const [isAnalyzingCSV, setIsAnalyzingCSV] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [isGeneratingPasswords, setIsGeneratingPasswords] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  // App state
  const [activeTab, setActiveTab] = useState('overview');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [orgChart, setOrgChart] = useState<any[]>([]);

  // Modal states
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    dueDate: '',
    assignedTo: [] as string[]
  });

  // Calculate role counts for display
  const roleCounts = employeeData.reduce((acc, emp) => {
    acc[emp.userType] = (acc[emp.userType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Authentication functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/permeate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        setIsAuthenticated(true);
        toast({
          title: "Welcome to PerMeaTe Enterprise",
          description: `Logged in as ${userData.name}`
        });
        
        // Check if company needs onboarding
        setCompanyId(userData.companyId);
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Unable to connect to server",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLocation('/');
  };

  // Data fetching functions
  const fetchCompanyData = async (companyId: string) => {
    try {
      // Fetch company details, employees, and goals
      const [companyRes, employeesRes, goalsRes] = await Promise.all([
        fetch(`/api/permeate/companies/${companyId}`),
        fetch(`/api/permeate/employees/${companyId}`),
        fetch(`/api/permeate/goals/${companyId}`)
      ]);

      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData.employees);
        setOrgChart(employeesData.orgChart);
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  // Onboarding functions
  const handleCompanySubmit = async () => {
    try {
      const response = await fetch('/api/permeate/onboard-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyForm.name,
          businessAreas: companyForm.businessAreas.split(',').map(s => s.trim()),
          employeeCount: companyForm.employeeCount,
          locations: companyForm.locations.split(',').map(s => s.trim())
        })
      });

      if (response.ok) {
        const company = await response.json();
        setCompanyId(company.id);
        setOnboardingStep(3);
        toast({
          title: "Company Created",
          description: "Now select employees for PerMeaTe access"
        });
      }
    } catch (error) {
      console.error('Company creation error:', error);
      toast({
        title: "Company Creation Failed",
        description: "Unable to create company profile",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzingCSV(true);
    setAnalysisProgress("Reading CSV file...");
    
    // Read and analyze CSV file
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      
      try {
        setAnalysisProgress("Analyzing organizational structure...");
        
        const response = await fetch('/api/permeate/analyze-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent })
        });

        if (response.ok) {
          setAnalysisProgress("Processing employee roles and assignments...");
          const data = await response.json();
          setEmployeeData(data.employees);
          
          // Auto-populate company details from CSV analysis
          if (data.companyDetails) {
            setCompanyForm({
              name: data.companyDetails.name || '',
              businessAreas: data.companyDetails.businessAreas || '',
              employeeCount: data.companyDetails.employeeCount || '',
              locations: data.companyDetails.locations || ''
            });
          }
          
          setAnalysisProgress("Analysis complete!");
          
          setTimeout(() => {
            setIsAnalyzingCSV(false);
            setAnalysisProgress("");
          }, 1000);
          
          toast({
            title: "CSV Analysis Complete",
            description: `Analyzed ${data.employees.length} employees with auto-populated company details`
          });
          
          // Move to step 2 after successful analysis
          setTimeout(() => {
            setOnboardingStep(2);
          }, 1500);
        } else {
          throw new Error('Analysis failed');
        }
      } catch (error) {
        console.error('CSV analysis error:', error);
        setIsAnalyzingCSV(false);
        setAnalysisProgress("");
        toast({
          title: "Analysis Failed",
          description: "Unable to process CSV file",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
  };

  const updateEmployeeRole = (index: number, newRole: string) => {
    const updatedEmployees = [...employeeData];
    updatedEmployees[index].userType = newRole as any;
    setEmployeeData(updatedEmployees);
  };

  const generateEmployeePasswords = async () => {
    setIsGeneratingPasswords(true);
    try {
      const response = await fetch(`/api/permeate/generate-passwords/${companyId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCredentials(data.credentials);
        setPasswordsGenerated(true);
        toast({
          title: "Passwords Generated",
          description: `Created secure credentials for ${data.credentials.length} employees`
        });
      }
    } catch (error) {
      console.error('Password generation error:', error);
      toast({
        title: "Password Generation Failed",
        description: "Unable to generate employee passwords",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPasswords(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Upload employee data to complete onboarding
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('csvFile', uploadedFile);
      }

      const response = await fetch(`/api/permeate/upload-csv/${companyId}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Onboarding Complete!",
          description: "PerMeaTe Enterprise is now ready for your organization"
        });
        
        // Mark company as onboarded and fetch data
        setCompany({
          id: companyId,
          name: companyForm.name,
          businessAreas: companyForm.businessAreas.split(',').map(s => s.trim()),
          employeeCount: parseInt(companyForm.employeeCount),
          locations: companyForm.locations.split(',').map(s => s.trim()),
          isOnboarded: true
        });
        fetchCompanyData(companyId);
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({
        title: "Onboarding Failed",
        description: "Unable to complete setup",
        variant: "destructive"
      });
    }
  };

  // Goal management functions
  const createGoal = async () => {
    if (!currentUser) return;

    try {
      const goalData = {
        ...goalForm,
        companyId: currentUser.companyId,
        createdBy: currentUser.id,
        assignedTo: goalForm.assignedTo
      };

      const response = await fetch('/api/permeate/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });

      if (response.ok) {
        const data = await response.json();
        setGoals([...goals, data.goal]);
        setShowCreateGoal(false);
        setGoalForm({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: [] });
        toast({
          title: "Goal Created", 
          description: `${data.goal.title} created with ${data.projects?.length || 0} strategic projects`
        });
      }
    } catch (error) {
      console.error('Goal creation error:', error);
      toast({
        title: "Goal Creation Failed",
        description: "Unable to create goal",
        variant: "destructive"
      });
    }
  };

  // Auto-assignment functions
  const autoAssignTasks = async (projectId: string) => {
    try {
      const project = goals.flatMap(g => g.projects).find(p => p.id === projectId);
      if (!project) return;

      const response = await fetch('/api/permeate/auto-assign-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          tasks: project.tasks,
          employees
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Tasks Auto-Assigned",
          description: `System assigned ${data.tasks.length} tasks to optimal team members`
        });
        
        // Refresh data
        if (currentUser) {
          fetchCompanyData(currentUser.companyId);
        }
      }
    } catch (error) {
      console.error('Auto-assignment error:', error);
      toast({
        title: "Auto-Assignment Failed",
        description: "Unable to assign tasks automatically",
        variant: "destructive"
      });
    }
  };

  // Task update functions
  const submitTaskUpdate = async (taskId: string, status: string, score?: number, notes?: string) => {
    if (!currentUser) return;

    try {
      const updateData = {
        taskId,
        employeeId: currentUser.id,
        status,
        score,
        notes,
        approvalStatus: 'pending'
      };

      const response = await fetch('/api/permeate/task-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: "Task Update Submitted",
          description: "Your update is pending approval"
        });
        
        // Refresh data
        fetchCompanyData(currentUser.companyId);
      }
    } catch (error) {
      console.error('Task update error:', error);
      toast({
        title: "Update Failed",
        description: "Unable to submit task update",
        variant: "destructive"
      });
    }
  };

  const approveTaskUpdate = async (updateId: string, approved: boolean, notes?: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/permeate/task-updates/${updateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus: approved ? 'approved' : 'rejected',
          approvedBy: currentUser.id,
          approvalNotes: notes
        })
      });

      if (response.ok) {
        toast({
          title: approved ? "Task Update Approved" : "Task Update Rejected",
          description: approved ? "Task status has been updated" : "Task update was rejected"
        });
        
        // Refresh data
        fetchCompanyData(currentUser.companyId);
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: "Approval Failed",
        description: "Unable to process approval",
        variant: "destructive"
      });
    }
  };

  // Component render functions
  const renderLogin = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-16 w-16" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          PerMeaTe Enterprise Beta Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in with your employee credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username (Email Alias)
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="mt-1"
                placeholder="Enter your email alias"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="mt-1"
                placeholder="Enter your secure password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">PerMeaTe Enterprise Setup</h1>
            <p className="text-gray-600 mt-2">
              Let's get your organization set up with intelligent workflow management
            </p>
          </div>

          <Card className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Step {onboardingStep} of 4</span>
                <span className="text-sm font-medium text-gray-500">
                  {onboardingStep === 1 ? 'CSV Upload' : 
                   onboardingStep === 2 ? 'Company Details' : 
                   onboardingStep === 3 ? 'Employee Selection' : 'Review & Complete'}
                </span>
              </div>
              <Progress value={onboardingStep * 25} className="w-full" />
            </div>

            {/* Step 1: CSV Upload & Organization Analysis */}
            {onboardingStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Organization Data</h3>
                  <p className="text-gray-600 mb-4">
                    Upload your employee CSV file. PerMeaTe will analyze your organizational structure and auto-populate company details.
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={isAnalyzingCSV}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {uploadedFile && !isAnalyzingCSV && (
                      <p className="mt-2 text-sm text-green-600">
                        File uploaded: {uploadedFile.name}
                      </p>
                    )}
                    
                    {/* Analysis Progress Indicator */}
                    {isAnalyzingCSV && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="text-sm font-medium text-blue-600">{analysisProgress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          AI is analyzing your organizational structure and extracting company details. This may take 1-2 minutes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setOnboardingStep(2)}
                    disabled={employeeData.length === 0 || isAnalyzingCSV}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue to Company Details
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Company Details Review */}
            {onboardingStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Company Details</h3>
                  <p className="text-gray-600 mb-4">
                    Review and edit the company information extracted from your CSV data.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Name</label>
                      <Input
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                        placeholder="Enter your company name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Areas</label>
                      <Input
                        value={companyForm.businessAreas}
                        onChange={(e) => setCompanyForm({...companyForm, businessAreas: e.target.value})}
                        placeholder="Technology, Marketing, Sales (comma-separated)"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee Count</label>
                      <Input
                        value={companyForm.employeeCount}
                        onChange={(e) => setCompanyForm({...companyForm, employeeCount: e.target.value})}
                        placeholder="Number of employees"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Office Locations</label>
                      <Input
                        value={companyForm.locations}
                        onChange={(e) => setCompanyForm({...companyForm, locations: e.target.value})}
                        placeholder="New York, London, Tokyo (comma-separated)"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setOnboardingStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleCompanySubmit}
                    disabled={!companyForm.name}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue to Employee Selection
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Employee Selection & Role Assignment */}
            {onboardingStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employees for PerMeaTe Access</h3>
                  <p className="text-gray-600 mb-4">
                    Choose which employees should have access to PerMeaTe and assign their roles. Include yourself as an Administrator.
                  </p>
                  
                  {/* Employee Search and Selection */}
                  {employeeData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex gap-4 items-center">
                        <div className="flex-1">
                          <Input
                            placeholder="Search employees by name, role, or department..."
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const allIds = new Set(employeeData.map(emp => emp.id));
                            setSelectedEmployees(selectedEmployees.size === employeeData.length ? new Set() : allIds);
                          }}
                        >
                          {selectedEmployees.size === employeeData.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {selectedEmployees.size} of {employeeData.length} employees selected for PerMeaTe access
                      </div>
                      
                      {/* Employee List with Selection */}
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                        {employeeData
                          .filter(emp => 
                            employeeSearchTerm === '' || 
                            emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                            emp.role.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                            (emp.department && emp.department.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
                          )
                          .map((employee, index) => {
                            const isSelected = selectedEmployees.has(employee.id);
                            return (
                              <div key={employee.id} className={`p-4 border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const newSelected = new Set(selectedEmployees);
                                        if (e.target.checked) {
                                          newSelected.add(employee.id);
                                        } else {
                                          newSelected.delete(employee.id);
                                        }
                                        setSelectedEmployees(newSelected);
                                      }}
                                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900">{employee.name}</p>
                                      <p className="text-sm text-gray-600">{employee.alias} • {employee.role}</p>
                                      {employee.department && (
                                        <p className="text-xs text-gray-500">{employee.department}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {isSelected && (
                                    <select
                                      value={employee.userType}
                                      onChange={(e) => updateEmployeeRole(index, e.target.value)}
                                      className="text-sm border border-gray-300 rounded px-2 py-1"
                                    >
                                      <option value="organization_leader">Organization Leader</option>
                                      <option value="project_leader">Project Leader</option>
                                      <option value="team_member">Team Member</option>
                                      <option value="administrator">Administrator</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      
                      {/* Role Summary for Selected Employees */}
                      {selectedEmployees.size > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mt-4">
                          {Object.entries(
                            employeeData
                              .filter(emp => selectedEmployees.has(emp.id))
                              .reduce((acc, emp) => {
                                acc[emp.userType] = (acc[emp.userType] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                          ).map(([role, count]) => (
                            <div key={role} className="text-center">
                              <div className="text-lg font-bold text-blue-600">{count}</div>
                              <div className="text-xs text-gray-600 capitalize">{role.replace('_', ' ')}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Password Generation Section */}
                      {selectedEmployees.size > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2">Authentication Setup</h5>
                          <p className="text-sm text-blue-700 mb-3">
                            Generate secure passwords for {selectedEmployees.size} selected employees. Each employee will receive login credentials with their email alias as username.
                          </p>
                          <Button
                            onClick={generateEmployeePasswords}
                            disabled={passwordsGenerated || isGeneratingPasswords || selectedEmployees.size === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isGeneratingPasswords ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating Passwords...
                              </div>
                            ) : passwordsGenerated ? 
                              'Passwords Generated ✓' : 
                              `Generate Passwords for ${selectedEmployees.size} Employees`
                            }
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setOnboardingStep(2)}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setOnboardingStep(4)}
                    disabled={selectedEmployees.size === 0 || !passwordsGenerated || isAnalyzingCSV || isGeneratingPasswords}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review and Complete */}
            {onboardingStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Complete Setup</h3>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Company Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <dt className="font-medium text-gray-900">Company Name</dt>
                            <dd className="text-gray-600">{companyForm.name}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-900">Employee Count</dt>
                            <dd className="text-gray-600">{companyForm.employeeCount}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-900">Business Areas</dt>
                            <dd className="text-gray-600">{companyForm.businessAreas}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-900">Locations</dt>
                            <dd className="text-gray-600">{companyForm.locations}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Employee Setup Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(roleCounts).map(([role, count]) => (
                            <div key={role} className="text-center p-3 bg-gray-50 rounded">
                              <div className="text-2xl font-bold text-blue-600">{count}</div>
                              <div className="text-sm text-gray-600 capitalize">{role.replace('_', ' ')}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {generatedCredentials.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Generated Employee Credentials</CardTitle>
                          <CardDescription>
                            Download and securely distribute these credentials to your employees
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => {
                              const csvContent = "Name,Email,Username,Password,Role\n" +
                                generatedCredentials.map(cred => 
                                  `${cred.name},${cred.email},${cred.username},${cred.password},${cred.permeateRole}`
                                ).join('\n');
                              
                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'permeate-employee-credentials.csv';
                              a.click();
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Credentials CSV
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
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
                    Complete Setup & Launch PerMeaTe
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );

  // Main app render logic
  if (!isAuthenticated) {
    return renderLogin();
  }

  // If authenticated but no company data or company is not onboarded, show onboarding
  if (!company || !company.isOnboarded) {
    return renderOnboarding();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Two-tier header structure - Dark Street Tech navbar at top */}
      <Navbar />
      
      {/* PerMeaTe Enterprise header - positioned at exactly 64px */}
      <div 
        className="sticky top-16 bg-white border-b border-gray-200 shadow-sm z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-10 w-10" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">PerMeaTe Enterprise</h1>
                <p className="text-sm text-gray-600">Turn goals into real, measurable work.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <User className="h-4 w-4 inline mr-1" />
                {currentUser?.name} ({currentUser?.permeateRole.replace('_', ' ')})
              </div>
              {currentUser?.permeateRole === 'administrator' && (
                <Button variant="outline" size="sm" onClick={() => {
                  setCompany(null);
                  setOnboardingStep(1);
                  setEmployeeData([]);
                  setPasswordsGenerated(false);
                  toast({
                    title: "Re-onboarding Started",
                    description: "Starting fresh onboarding process"
                  });
                }}>
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Re-onboard
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Function tabs - positioned at exactly 128px */}
      <div 
        className="sticky top-32 bg-gray-50 border-b border-gray-200 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 py-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main content area - positioned below sticky headers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: '2rem' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{goals.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {goals.filter(g => g.status === 'completed').length} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {goals.flatMap(g => g.projects).filter(p => p.status === 'active').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across {goals.length} goals
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{employees.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active employees
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {goals.slice(0, 3).map((goal) => (
                        <div key={goal.id} className="flex items-center space-x-4">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{goal.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {goal.projects.length} projects • {goal.priority} priority
                            </p>
                          </div>
                          <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                            {goal.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {employees.slice(0, 3).map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-4">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.role} • {employee.department}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {employee.permeateRole.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Goals Management</h2>
                <Button onClick={() => setShowCreateGoal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>

              <div className="grid gap-6">
                {goals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{goal.title}</CardTitle>
                          <CardDescription>{goal.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            goal.priority === 'critical' ? 'destructive' : 
                            goal.priority === 'high' ? 'default' : 'secondary'
                          }>
                            {goal.priority}
                          </Badge>
                          <Badge variant={goal.status === 'completed' ? 'default' : 'outline'}>
                            {goal.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Projects:</span> {goal.projects.length}
                          </div>
                          <div>
                            <span className="font-medium">Tasks:</span> {goal.projects.flatMap(p => p.tasks).length}
                          </div>
                        </div>

                        {goal.projects.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Projects:</h4>
                            {goal.projects.map((project) => (
                              <div key={project.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{project.title}</span>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{project.status}</Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => autoAssignTasks(project.id)}
                                  >
                                    Auto-Assign Tasks
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Projects & Tasks</h2>
              
              <div className="space-y-6">
                {goals.flatMap(goal => 
                  goal.projects.map(project => (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{project.title}</CardTitle>
                            <CardDescription>
                              Part of: {goals.find(g => g.id === project.goalId)?.title}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{project.status}</Badge>
                            <Badge variant={project.priority === 'high' ? 'destructive' : 'secondary'}>
                              {project.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Progress value={project.progress} />
                          
                          {project.tasks.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium">Tasks ({project.tasks.length}):</h4>
                              <div className="space-y-2">
                                {project.tasks.map((task) => (
                                  <div key={task.id} className="flex justify-between items-center p-3 border rounded">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        {task.status === 'completed' ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Circle className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="font-medium">{task.title}</span>
                                      </div>
                                      {task.description && (
                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                      )}
                                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                        <span>Assigned to: {
                                          employees.find(e => e.id === task.assignedTo)?.name || 'Unassigned'
                                        }</span>
                                        <span>Priority: {task.priority}</span>
                                        <span>Score: {task.score}/100</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={
                                        task.status === 'completed' ? 'default' :
                                        task.status === 'in_progress' ? 'secondary' : 'outline'
                                      }>
                                        {task.status.replace('_', ' ')}
                                      </Badge>
                                      {currentUser?.id === task.assignedTo && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const status = task.status === 'todo' ? 'in_progress' : 
                                                         task.status === 'in_progress' ? 'completed' : 'completed';
                                            submitTaskUpdate(task.id, status, 85, 'Task completed successfully');
                                          }}
                                        >
                                          Update Status
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">AI-Powered Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0}%
                    </div>
                    <p className="text-sm text-gray-600">Goals completed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Workstreams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {goals.flatMap(g => g.projects).filter(p => p.status === 'active').length}
                    </div>
                    <p className="text-sm text-gray-600">Projects in progress</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round((employees.filter(e => e.isActive).length / employees.length) * 100)}%
                    </div>
                    <p className="text-sm text-gray-600">Active team members</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>AI-generated analysis of organizational performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Strengths</h4>
                      <ul className="mt-2 text-sm text-green-700 space-y-1">
                        <li>• Strong goal completion rate across teams</li>
                        <li>• Effective project leadership structure</li>
                        <li>• Good task distribution among team members</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900">Areas for Improvement</h4>
                      <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                        <li>• Consider implementing more frequent check-ins</li>
                        <li>• Some projects may benefit from additional resources</li>
                        <li>• Cross-functional collaboration could be enhanced</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <Button onClick={() => setShowUserManagement(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              <div className="grid gap-6">
                {/* Organization Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Chart</CardTitle>
                    <CardDescription>Interactive organizational structure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orgChart.map((rootEmployee, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{rootEmployee.name}</h4>
                              <p className="text-sm text-gray-600">{rootEmployee.role}</p>
                              <Badge variant="outline">
                                {rootEmployee.permeateRole.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          {rootEmployee.children && rootEmployee.children.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {rootEmployee.children.map((child: any, childIndex: number) => (
                                <div key={childIndex} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{child.name}</p>
                                    <p className="text-xs text-gray-600">{child.role}</p>
                                  </div>
                                  <Badge variant="outline">
                                    {child.permeateRole.replace('_', ' ')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Employee List */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Employees ({employees.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {employees.map((employee) => (
                        <div key={employee.id} className="flex justify-between items-center p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-gray-600">{employee.email}</p>
                              <p className="text-xs text-gray-500">
                                {employee.role} • {employee.department}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {employee.permeateRole.replace('_', ' ')}
                            </Badge>
                            <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Create a business goal and PerMeaTe will automatically break it down into actionable projects and tasks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Goal Title</label>
              <Input
                value={goalForm.title}
                onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                placeholder="e.g., Increase customer satisfaction by 20%"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <Textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                placeholder="Provide context and details about this goal..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={goalForm.priority}
                  onChange={(e) => setGoalForm({...goalForm, priority: e.target.value as any})}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <Input
                  type="date"
                  value={goalForm.dueDate}
                  onChange={(e) => setGoalForm({...goalForm, dueDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateGoal(false)}>
                Cancel
              </Button>
              <Button onClick={createGoal} disabled={!goalForm.title}>
                Create Goal & Generate Projects
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}