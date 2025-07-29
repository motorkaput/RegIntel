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

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  targetDate?: string;
  progress: number;
  projects: Project[];
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

  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'projects' | 'analytics'>('overview');
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

  // Mock data for development
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Increase Revenue by 25%',
      description: 'Achieve 25% revenue growth through new product launches and market expansion',
      status: 'active',
      createdAt: new Date().toISOString(),
      targetDate: '2025-12-31',
      progress: 35,
      projects: [
        {
          id: 'p1',
          goalId: '1',
          title: 'Product Launch - Mobile App',
          description: 'Launch new mobile application with core features',
          status: 'in_progress',
          assignedTo: 'Product Team',
          progress: 60,
          tasks: [
            {
              id: 't1',
              projectId: 'p1',
              title: 'Design User Interface',
              description: 'Create UI/UX designs for mobile app',
              status: 'completed',
              assignedTo: 'Design Team',
              priority: 'high',
              score: 85,
              dueDate: '2025-08-15'
            },
            {
              id: 't2',
              projectId: 'p1',
              title: 'Develop Core Features',
              description: 'Implement main functionality',
              status: 'in_progress',
              assignedTo: 'Dev Team',
              priority: 'high',
              score: 0,
              dueDate: '2025-09-30'
            }
          ]
        }
      ]
    }
  ]);

  const createGoal = () => {
    if (!newGoalTitle.trim()) return;
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      description: newGoalDescription,
      status: 'active',
      createdAt: new Date().toISOString(),
      progress: 0,
      projects: []
    };
    
    setGoals([...goals, newGoal]);
    setNewGoalTitle("");
    setNewGoalDescription("");
    setShowNewGoalForm(false);
    
    toast({
      title: "Goal Created",
      description: `"${newGoalTitle}" has been added to your goals`,
    });
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

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      {/* PerMeaTe Enterprise Header */}
      <div className="sticky top-36 z-40 bg-white border-b border-gray-200 shadow-sm">
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
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900">Goal Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {goals.filter(g => g.status === 'completed').length}/{goals.length}
                  </div>
                  <p className="text-sm text-gray-600">
                    {goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0}% completion rate
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900">Task Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {goals.flatMap(g => g.projects).flatMap(p => p.tasks)
                      .filter(t => t.status === 'completed')
                      .slice(0, 3)
                      .map((task) => (
                        <div key={task.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{task.title}</span>
                          <span className="text-sm font-medium text-blue-600">Score: {task.score}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Performance Summary</CardTitle>
                <CardDescription>Overall organizational performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {goals.reduce((acc, goal) => acc + goal.projects.length, 0)}
                    </div>
                    <p className="text-sm text-gray-600">Active Projects</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {goals.flatMap(g => g.projects).flatMap(p => p.tasks).length}
                    </div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        goals.flatMap(g => g.projects).flatMap(p => p.tasks)
                          .filter(t => t.status === 'completed')
                          .reduce((acc, task) => acc + task.score, 0) / 
                        Math.max(1, goals.flatMap(g => g.projects).flatMap(p => p.tasks).filter(t => t.status === 'completed').length)
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Avg Task Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}