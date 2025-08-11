import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { analyzeOrganization, breakDownGoal, recommendAssignments } from '@/lib/ai';
import { OrgAnalysisSchema, GoalBreakdownSchema, AssignmentRecommendationSchema } from '@/lib/ai/schemas';

// Set test environment
process.env.NODE_ENV = 'test';

describe('AI Services', () => {
  describe('Schema Validation', () => {
    it('should validate OrgAnalysisSchema correctly', () => {
      const validData = {
        leaders: [
          {
            user_id: 'user-1',
            name: 'John Doe',
            role: 'admin',
            team_size: 5,
            leadership_style: 'Collaborative',
            key_strengths: ['Strategic thinking', 'Communication']
          }
        ],
        functional_clusters: [
          {
            name: 'Engineering',
            members: ['user-1', 'user-2'],
            primary_skills: ['React', 'Node.js'],
            collaboration_score: 8,
            efficiency_rating: 'High'
          }
        ],
        skill_heatmap: {
          'React': {
            coverage: 80,
            depth: 4,
            gaps: ['Advanced patterns'],
            experts: ['user-1']
          }
        },
        risk_list: [
          {
            category: 'Technical',
            description: 'Legacy code',
            severity: 'medium',
            affected_areas: ['Frontend'],
            mitigation_suggestions: ['Refactoring']
          }
        ],
        assumptions: [
          {
            statement: 'Team velocity is stable',
            confidence: 85,
            impact_if_wrong: 'Project delays',
            validation_method: 'Sprint tracking'
          }
        ]
      };

      const result = OrgAnalysisSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate GoalBreakdownSchema correctly', () => {
      const validData = {
        projects: [
          {
            title: 'Project Alpha',
            description: 'Build new feature',
            estimated_hours: 120,
            dependencies: ['API design'],
            acceptance_criteria: ['Feature works', 'Tests pass'],
            required_skills: ['React', 'TypeScript'],
            suggested_assignees: [
              {
                user_id: 'user-1',
                reason: 'Has required skills',
                confidence: 90
              }
            ],
            location_pref: 'Remote',
            priority: 'high',
            risk_factors: ['Third-party dependency']
          }
        ]
      };

      const result = GoalBreakdownSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate AssignmentRecommendationSchema correctly', () => {
      const validData = {
        candidates: [
          {
            user_id: 'user-1',
            rank: 1,
            confidence: 92,
            reason: 'Perfect skill match',
            skill_match: 95,
            availability_score: 80,
            location_match: true,
            workload_impact: 'medium'
          }
        ]
      };

      const result = AssignmentRecommendationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        leaders: [
          {
            // Missing required fields
            name: 'John Doe'
          }
        ],
        functional_clusters: [],
        skill_heatmap: {},
        risk_list: [],
        assumptions: []
      };

      const result = OrgAnalysisSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('AI Service Functions', () => {
    const mockRoster = [
      {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        role: 'admin',
        skills: [{ skill: { name: 'React' } }]
      }
    ];

    const mockReporting = [
      {
        user_id: 'user-1',
        name: 'John Doe',
        role: 'admin',
        manager_id: null,
        direct_reports: []
      }
    ];

    const mockSkills = [
      {
        user_id: 'user-1',
        name: 'John Doe',
        skills: [{ name: 'React', proficiency: 'expert' }]
      }
    ];

    it('should analyze organization with mock data', async () => {
      const result = await analyzeOrganization(mockRoster, mockReporting, mockSkills);
      
      expect(result).toBeDefined();
      expect(result.leaders).toBeInstanceOf(Array);
      expect(result.functional_clusters).toBeInstanceOf(Array);
      expect(result.skill_heatmap).toBeDefined();
      expect(result.risk_list).toBeInstanceOf(Array);
      expect(result.assumptions).toBeInstanceOf(Array);

      // Validate against schema
      const validation = OrgAnalysisSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });

    it('should break down goals with mock data', async () => {
      const context = {
        organizationName: 'Test Corp',
        teamSize: 5,
        timeline: '3 months',
        budgetInfo: '$50k',
        teamRoster: mockRoster,
        availableSkills: ['React', 'Node.js']
      };

      const result = await breakDownGoal('Build customer portal', context);
      
      expect(result).toBeDefined();
      expect(result.projects).toBeInstanceOf(Array);
      expect(result.projects.length).toBeGreaterThan(0);

      // Validate against schema
      const validation = GoalBreakdownSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });

    it('should recommend assignments with mock data', async () => {
      const task = {
        description: 'Build React component',
        requiredSkills: ['React', 'TypeScript'],
        estimatedHours: 40,
        timeline: '1 week',
        locationPreference: 'Remote'
      };

      const result = await recommendAssignments(task, mockRoster);
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeInstanceOf(Array);
      expect(result.candidates.length).toBeGreaterThan(0);

      // Validate against schema
      const validation = AssignmentRecommendationSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty roster gracefully', async () => {
      const result = await analyzeOrganization([], [], []);
      
      expect(result).toBeDefined();
      // Should still return valid structure even with empty data
      const validation = OrgAnalysisSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });

    it('should handle invalid goal text', async () => {
      const context = {
        organizationName: 'Test Corp',
        teamSize: 0,
        teamRoster: [],
        availableSkills: []
      };

      // Should still work with empty context (mocked response)
      const result = await breakDownGoal('', context);
      expect(result).toBeDefined();
    });
  });
});