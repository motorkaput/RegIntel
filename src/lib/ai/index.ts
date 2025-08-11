import { callOpenAI, createMockOpenAIResponse, isTestEnvironment } from './openai';
import { 
  OrgAnalysisSchema, 
  GoalBreakdownSchema, 
  AssignmentRecommendationSchema,
  type OrgAnalysis,
  type GoalBreakdown, 
  type AssignmentRecommendation 
} from './schemas';

// Mock data for testing
const MOCK_ORG_ANALYSIS: OrgAnalysis = {
  leaders: [
    {
      user_id: 'user-1',
      name: 'Asha Menon',
      role: 'org_leader',
      team_size: 12,
      leadership_style: 'Collaborative',
      key_strengths: ['Strategic thinking', 'Team building', 'Product vision']
    }
  ],
  functional_clusters: [
    {
      name: 'Engineering',
      members: ['user-2', 'user-3', 'user-4'],
      primary_skills: ['React', 'Node.js', 'Python'],
      collaboration_score: 8,
      efficiency_rating: 'High'
    }
  ],
  skill_heatmap: {
    'React': {
      coverage: 75,
      depth: 4,
      gaps: ['Advanced patterns', 'Performance optimization'],
      experts: ['user-2', 'user-3']
    }
  },
  risk_list: [
    {
      category: 'Technical Debt',
      description: 'Legacy codebase requires modernization',
      severity: 'medium',
      affected_areas: ['Frontend', 'API Layer'],
      mitigation_suggestions: ['Gradual refactoring', 'Code review standards']
    }
  ],
  assumptions: [
    {
      statement: 'Team velocity will remain consistent',
      confidence: 80,
      impact_if_wrong: 'Project delays and resource reallocation needed',
      validation_method: 'Weekly sprint reviews and velocity tracking'
    }
  ]
};

const MOCK_GOAL_BREAKDOWN: GoalBreakdown = {
  projects: [
    {
      title: 'Customer Portal Implementation',
      description: 'Build self-service customer portal with account management',
      estimated_hours: 240,
      dependencies: ['API Authentication', 'Database Schema'],
      acceptance_criteria: [
        'Users can log in and view account details',
        'Support ticket creation and tracking',
        'Mobile responsive design'
      ],
      required_skills: ['React', 'Node.js', 'PostgreSQL'],
      suggested_assignees: [
        {
          user_id: 'user-2',
          reason: 'Strong React skills and previous portal experience',
          confidence: 90
        }
      ],
      location_pref: 'Remote',
      priority: 'high',
      risk_factors: ['API rate limiting', 'Third-party integration delays']
    }
  ]
};

const MOCK_ASSIGNMENT_RECOMMENDATION: AssignmentRecommendation = {
  candidates: [
    {
      user_id: 'user-2',
      rank: 1,
      confidence: 92,
      reason: 'Perfect skill match with React and Node.js expertise, available capacity',
      skill_match: 95,
      availability_score: 85,
      location_match: true,
      workload_impact: 'medium'
    },
    {
      user_id: 'user-3',
      rank: 2,
      confidence: 78,
      reason: 'Strong technical skills but currently at capacity',
      skill_match: 88,
      availability_score: 40,
      location_match: true,
      workload_impact: 'high'
    }
  ]
};

export async function analyzeOrganization(
  roster: any[], 
  reporting: any[], 
  skills: any[],
  context: { tenantId: string; userId: string; role: string }
): Promise<OrgAnalysis> {
  // Use mock data in test environment
  if (isTestEnvironment) {
    const mockResponse = createMockOpenAIResponse(MOCK_ORG_ANALYSIS);
    if (mockResponse.success && mockResponse.data) {
      return mockResponse.data;
    }
    throw new Error('Mock response failed');
  }

  const response = await callOpenAI<OrgAnalysis>({
    promptTemplate: 'org-analysis',
    variables: {
      organization_name: 'PerMeaTe Enterprise',
      employee_count: roster.length,
      analysis_date: new Date().toISOString().split('T')[0],
      employee_roster: roster,
      reporting_structure: reporting,
      skills_matrix: skills
    },
    schema: OrgAnalysisSchema,
    tenantId: context.tenantId,
    userId: context.userId,
    role: context.role
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to analyze organization');
  }

  return response.data;
}

export async function breakDownGoal(
  goalText: string, 
  context: {
    organizationName: string;
    teamSize: number;
    timeline?: string;
    budgetInfo?: string;
    teamRoster: any[];
    availableSkills: string[];
  },
  authContext: { tenantId: string; userId: string; role: string }
): Promise<GoalBreakdown> {
  // Use mock data in test environment
  if (isTestEnvironment) {
    const mockResponse = createMockOpenAIResponse(MOCK_GOAL_BREAKDOWN);
    if (mockResponse.success && mockResponse.data) {
      return mockResponse.data;
    }
    throw new Error('Mock response failed');
  }

  const response = await callOpenAI<GoalBreakdown>({
    promptTemplate: 'goal-breakdown',
    variables: {
      goal_text: goalText,
      organization_name: context.organizationName,
      team_size: context.teamSize,
      timeline: context.timeline || 'Not specified',
      budget_info: context.budgetInfo || 'Not specified',
      team_roster: context.teamRoster,
      available_skills: context.availableSkills
    },
    schema: GoalBreakdownSchema,
    tenantId: authContext.tenantId,
    userId: authContext.userId,
    role: authContext.role
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to break down goal');
  }

  return response.data;
}

export async function recommendAssignments(
  task: {
    description: string;
    requiredSkills: string[];
    estimatedHours: number;
    timeline?: string;
    locationPreference?: string;
  },
  roster: any[],
  context: { tenantId: string; userId: string; role: string }
): Promise<AssignmentRecommendation> {
  // Use mock data in test environment
  if (isTestEnvironment) {
    const mockResponse = createMockOpenAIResponse(MOCK_ASSIGNMENT_RECOMMENDATION);
    if (mockResponse.success && mockResponse.data) {
      return mockResponse.data;
    }
    throw new Error('Mock response failed');
  }

  const response = await callOpenAI<AssignmentRecommendation>({
    promptTemplate: 'assignment-recommendation',
    variables: {
      task_description: task.description,
      required_skills: task.requiredSkills,
      estimated_hours: task.estimatedHours,
      timeline: task.timeline || 'Not specified',
      location_preference: task.locationPreference || 'Not specified',
      team_roster: roster,
      current_workloads: roster.map(member => ({
        user_id: member.id,
        current_capacity: 80 // This would come from actual workload data
      }))
    },
    schema: AssignmentRecommendationSchema,
    tenantId: context.tenantId,
    userId: context.userId,
    role: context.role
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to recommend assignments');
  }

  return response.data;
}