import { z } from 'zod';

// Organization Analysis Schema
export const OrgAnalysisSchema = z.object({
  leaders: z.array(z.object({
    user_id: z.string(),
    name: z.string(),
    role: z.string(),
    team_size: z.number(),
    leadership_style: z.string(),
    key_strengths: z.array(z.string())
  })),
  functional_clusters: z.array(z.object({
    name: z.string(),
    members: z.array(z.string()), // user_ids
    primary_skills: z.array(z.string()),
    collaboration_score: z.number().min(0).max(10),
    efficiency_rating: z.string()
  })),
  skill_heatmap: z.record(z.string(), z.object({
    coverage: z.number().min(0).max(100), // percentage
    depth: z.number().min(1).max(5), // 1-5 scale
    gaps: z.array(z.string()),
    experts: z.array(z.string()) // user_ids
  })),
  risk_list: z.array(z.object({
    category: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    affected_areas: z.array(z.string()),
    mitigation_suggestions: z.array(z.string())
  })),
  assumptions: z.array(z.object({
    statement: z.string(),
    confidence: z.number().min(0).max(100),
    impact_if_wrong: z.string(),
    validation_method: z.string()
  }))
});

// Goal Breakdown Schema
export const GoalBreakdownSchema = z.object({
  projects: z.array(z.object({
    title: z.string(),
    description: z.string(),
    estimated_hours: z.number().min(0),
    dependencies: z.array(z.string()),
    acceptance_criteria: z.array(z.string()),
    required_skills: z.array(z.string()),
    suggested_assignees: z.array(z.object({
      user_id: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(100)
    })),
    location_pref: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    risk_factors: z.array(z.string())
  }))
});

// Assignment Recommendation Schema
export const AssignmentRecommendationSchema = z.object({
  candidates: z.array(z.object({
    user_id: z.string(),
    rank: z.number().min(1),
    confidence: z.number().min(0).max(100),
    reason: z.string(),
    skill_match: z.number().min(0).max(100),
    availability_score: z.number().min(0).max(100),
    location_match: z.boolean(),
    workload_impact: z.string()
  }))
});

// Proposal Schema
export const ProposalSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  type: z.enum(['org_analysis', 'goal_breakdown', 'assignment']),
  input: z.any(), // JSON input data
  output: z.any(), // JSON output matching one of the above schemas
  status: z.enum(['proposed', 'accepted', 'modified', 'rejected']),
  created_by_user_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  review_comment: z.string().optional()
});

export type OrgAnalysis = z.infer<typeof OrgAnalysisSchema>;
export type GoalBreakdown = z.infer<typeof GoalBreakdownSchema>;
export type AssignmentRecommendation = z.infer<typeof AssignmentRecommendationSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;