import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY_PE 
});

export interface AnalyzedEmployee {
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

export interface OrganizationInsights {
  totalEmployees: number;
  departments: { name: string; count: number; leads: string[] }[];
  skillMatrix: { skill: string; count: number; employees: string[] }[];
  reportingStructure: { manager: string; directReports: string[] }[];
  recommendations: string[];
  potentialIssues: string[];
}

export async function analyzeCSVData(csvContent: string): Promise<{
  employees: AnalyzedEmployee[];
  insights: OrganizationInsights;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert organizational analyst. Analyze the provided CSV employee data and extract structured information about the organization.

For each employee, determine:
- Basic info (ID, name, email, location, role)
- Reporting relationships
- Key skills (inferred from role if not provided)
- User type based on role:
  * administrator: IT roles, system admins, HR leads
  * project_leader: managers, team leads, senior roles
  * team_member: individual contributors, junior/mid-level
  * organization_leader: C-level, VPs, directors
- Department categorization
- Seniority level (junior/mid/senior/executive)

Also provide organizational insights including department structure, skill distribution, reporting hierarchy, and recommendations.

Respond with JSON in this exact format:
{
  "employees": [
    {
      "id": "unique_id",
      "employeeId": "from_csv",
      "name": "full_name",
      "alias": "email",
      "location": "city_country",
      "role": "job_title",
      "reportingTo": "manager_employee_id_or_null",
      "keySkills": ["skill1", "skill2"],
      "userType": "one_of_four_types",
      "department": "inferred_department",
      "seniority": "junior|mid|senior|executive",
      "workload": 0
    }
  ],
  "insights": {
    "totalEmployees": number,
    "departments": [{"name": "dept", "count": number, "leads": ["names"]}],
    "skillMatrix": [{"skill": "skill", "count": number, "employees": ["names"]}],
    "reportingStructure": [{"manager": "name", "directReports": ["names"]}],
    "recommendations": ["recommendation_strings"],
    "potentialIssues": ["issue_strings"]
  }
}`
        },
        {
          role: "user",
          content: `Analyze this employee CSV data:\n\n${csvContent}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error analyzing CSV data:', error);
    throw new Error('Failed to analyze employee data');
  }
}

export async function generateGoalBreakdown(goalTitle: string, goalDescription: string, companyContext: string): Promise<{
  projects: Array<{
    title: string;
    description: string;
    tasks: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimatedDays: number;
      requiredSkills: string[];
    }>;
  }>;
  timeline: string;
  resources: string[];
  successMetrics: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert project strategist. Break down business goals into actionable projects and tasks.

Analyze the goal and company context to create:
- 2-4 strategic projects that will achieve the goal
- 3-6 specific tasks per project with clear deliverables
- Priority levels and time estimates
- Required skills for each task
- Success metrics and resource requirements

Respond with JSON in this exact format:
{
  "projects": [
    {
      "title": "project_name",
      "description": "detailed_description",
      "tasks": [
        {
          "title": "task_name",
          "description": "specific_deliverable",
          "priority": "low|medium|high",
          "estimatedDays": number,
          "requiredSkills": ["skill1", "skill2"]
        }
      ]
    }
  ],
  "timeline": "overall_timeline_estimate",
  "resources": ["resource_requirements"],
  "successMetrics": ["measurable_outcomes"]
}`
        },
        {
          role: "user",
          content: `Goal: ${goalTitle}\nDescription: ${goalDescription}\nCompany Context: ${companyContext}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error generating goal breakdown:', error);
    throw new Error('Failed to generate goal breakdown');
  }
}

export async function analyzePerformanceData(goalsData: any[], projectsData: any[], tasksData: any[]): Promise<{
  overallScore: number;
  insights: string[];
  recommendations: string[];
  riskAreas: string[];
  topPerformers: string[];
  improvementAreas: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert performance analyst. Analyze organizational performance data to provide actionable insights.

Evaluate:
- Goal completion rates and progress
- Project delivery efficiency  
- Task completion patterns
- Resource utilization
- Risk identification
- Performance trends

Provide an overall performance score (0-100) and specific insights.

Respond with JSON in this exact format:
{
  "overallScore": number_0_to_100,
  "insights": ["key_insight_strings"],
  "recommendations": ["actionable_recommendation_strings"],
  "riskAreas": ["risk_identification_strings"],
  "topPerformers": ["high_performing_individuals_or_teams"],
  "improvementAreas": ["areas_needing_attention"]
}`
        },
        {
          role: "user",
          content: `Analyze this performance data:
Goals: ${JSON.stringify(goalsData)}
Projects: ${JSON.stringify(projectsData)}
Tasks: ${JSON.stringify(tasksData)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error analyzing performance data:', error);
    throw new Error('Failed to analyze performance data');
  }
}