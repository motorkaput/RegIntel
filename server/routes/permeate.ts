import type { Express } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../db";
import { 
  permeateCompanies, 
  permeateEmployees, 
  permeateGoals, 
  permeateProjects, 
  permeateTasks,
  permeateTaskUpdates,
  type InsertPermeateCompany,
  type InsertPermeateEmployee,
  type InsertPermeateGoal,
  type InsertPermeateProject,
  type InsertPermeateTask,
  type InsertPermeateTaskUpdate,
  type PermeateEmployee,
  type PermeateCompany
} from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { generateAIInsights } from "../services/permeateAI";

const upload = multer({ storage: multer.memoryStorage() });

export function registerPermeateRoutes(app: Express) {
  
  // Company onboarding
  app.post("/api/permeate/onboard-company", async (req, res) => {
    try {
      const { name, businessAreas, employeeCount, locations } = req.body;
      
      const [company] = await db.insert(permeateCompanies).values({
        name,
        businessAreas,
        employeeCount: parseInt(employeeCount),
        locations,
        isOnboarded: false
      }).returning();
      
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  // Upload and process CSV
  app.post("/api/permeate/upload-csv/:companyId", upload.single("csvFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const companyId = req.params.companyId;
      const csvBuffer = req.file.buffer;
      
      // Parse CSV using XLSX
      const workbook = XLSX.read(csvBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const csvData = XLSX.utils.sheet_to_json(worksheet);

      // Process employee data with AI role assignment
      const processedEmployees = await Promise.all(
        csvData.map(async (row: any) => {
          const employee: InsertPermeateEmployee = {
            companyId,
            name: row.name || row.Name || row.employee_name || "",
            email: row.email || row.Email || row.employee_email || "",
            role: row.role || row.Role || row.position || row.Position || "",
            department: row.department || row.Department || "",
            skills: row.skills ? row.skills.split(',').map((s: string) => s.trim()) : [],
            location: row.location || row.Location || "",
            managerEmail: row.manager_email || row.managerEmail || row.manager || "",
            permeateRole: await determinePermeateRole(row),
            hasPassword: false
          };
          return employee;
        })
      );

      // Insert employees
      const insertedEmployees = await db.insert(permeateEmployees).values(processedEmployees).returning();
      
      // Update company as onboarded
      await db.update(permeateCompanies)
        .set({ isOnboarded: true, updatedAt: new Date() })
        .where(eq(permeateCompanies.id, companyId));

      res.json({ 
        message: "CSV processed successfully",
        employees: insertedEmployees,
        count: insertedEmployees.length
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      res.status(500).json({ error: "Failed to process CSV file" });
    }
  });

  // Generate passwords for employees
  app.post("/api/permeate/generate-passwords/:companyId", async (req, res) => {
    try {
      const companyId = req.params.companyId;
      const employees = await db.select().from(permeateEmployees).where(eq(permeateEmployees.companyId, companyId));
      
      const passwordUpdates = await Promise.all(
        employees.map(async (employee) => {
          const password = generateSecurePassword();
          const passwordHash = await bcrypt.hash(password, 10);
          
          await db.update(permeateEmployees)
            .set({ 
              passwordHash,
              hasPassword: true,
              updatedAt: new Date()
            })
            .where(eq(permeateEmployees.id, employee.id));
            
          return {
            employeeId: employee.id,
            name: employee.name,
            email: employee.email,
            username: employee.email.split('@')[0], // email alias
            password,
            permeateRole: employee.permeateRole
          };
        })
      );
      
      res.json({ 
        message: "Passwords generated successfully",
        credentials: passwordUpdates
      });
    } catch (error) {
      console.error("Error generating passwords:", error);
      res.status(500).json({ error: "Failed to generate passwords" });
    }
  });

  // Employee login
  app.post("/api/permeate/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find employee by email alias
      const [employee] = await db.select()
        .from(permeateEmployees)
        .where(and(
          eq(permeateEmployees.email, `${username}@company.com`), // Assuming company domain
          eq(permeateEmployees.isActive, true)
        ));
        
      if (!employee || !employee.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(password, employee.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update last login
      await db.update(permeateEmployees)
        .set({ lastLogin: new Date() })
        .where(eq(permeateEmployees.id, employee.id));
      
      // Return employee data without password
      const { passwordHash, ...employeeData } = employee;
      res.json(employeeData);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get company employees with organization chart data
  app.get("/api/permeate/employees/:companyId", async (req, res) => {
    try {
      const companyId = req.params.companyId;
      const employees = await db.select().from(permeateEmployees)
        .where(and(
          eq(permeateEmployees.companyId, companyId),
          eq(permeateEmployees.isActive, true)
        ));
      
      // Build organization chart structure
      const orgChart = buildOrganizationChart(employees);
      
      res.json({ employees, orgChart });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  // Create goal with AI-powered project breakdown
  app.post("/api/permeate/goals", async (req, res) => {
    try {
      const goalData: InsertPermeateGoal = req.body;
      
      // Insert goal
      const [goal] = await db.insert(permeateGoals).values(goalData).returning();
      
      // Generate AI-powered project breakdown
      const aiBreakdown = await generateAIInsights(
        `Break down this goal into 3-5 specific projects: ${goal.title} - ${goal.description}`
      );
      
      // Create projects from AI breakdown
      const projects = aiBreakdown.projects?.map((project: any) => ({
        goalId: goal.id,
        companyId: goal.companyId,
        title: project.title,
        description: project.description,
        createdBy: goal.createdBy,
        priority: project.priority || 'medium'
      })) || [];
      
      if (projects.length > 0) {
        await db.insert(permeateProjects).values(projects);
      }
      
      res.json({ goal, projects });
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  // Get goals with projects and tasks
  app.get("/api/permeate/goals/:companyId", async (req, res) => {
    try {
      const companyId = req.params.companyId;
      
      const goals = await db.select().from(permeateGoals)
        .where(eq(permeateGoals.companyId, companyId))
        .orderBy(desc(permeateGoals.createdAt));
      
      // Get projects and tasks for each goal
      const goalsWithDetails = await Promise.all(
        goals.map(async (goal) => {
          const projects = await db.select().from(permeateProjects)
            .where(eq(permeateProjects.goalId, goal.id));
          
          const projectsWithTasks = await Promise.all(
            projects.map(async (project) => {
              const tasks = await db.select().from(permeateTasks)
                .where(eq(permeateTasks.projectId, project.id));
              return { ...project, tasks };
            })
          );
          
          return { ...goal, projects: projectsWithTasks };
        })
      );
      
      res.json(goalsWithDetails);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // Auto-assign tasks to team members
  app.post("/api/permeate/auto-assign-tasks", async (req, res) => {
    try {
      const { projectId, tasks } = req.body;
      
      // Get project details
      const [project] = await db.select().from(permeateProjects)
        .where(eq(permeateProjects.id, projectId));
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Get company employees for assignment
      const employees = await db.select().from(permeateEmployees)
        .where(and(
          eq(permeateEmployees.companyId, project.companyId),
          eq(permeateEmployees.isActive, true)
        ));
      
      // AI-powered task assignment based on skills, roles, and availability
      const assignedTasks = await Promise.all(
        tasks.map(async (task: any) => {
          const bestEmployee = await findBestEmployeeForTask(task, employees);
          
          const taskData: InsertPermeateTask = {
            projectId: project.id,
            goalId: project.goalId,
            companyId: project.companyId,
            title: task.title,
            description: task.description,
            createdBy: task.createdBy,
            assignedTo: bestEmployee?.id,
            priority: task.priority || 'medium'
          };
          
          return taskData;
        })
      );
      
      const insertedTasks = await db.insert(permeateTasks).values(assignedTasks).returning();
      
      res.json({ 
        message: "Tasks assigned successfully",
        tasks: insertedTasks
      });
    } catch (error) {
      console.error("Error auto-assigning tasks:", error);
      res.status(500).json({ error: "Failed to assign tasks" });
    }
  });

  // Submit task status update
  app.post("/api/permeate/task-updates", async (req, res) => {
    try {
      const updateData: InsertPermeateTaskUpdate = req.body;
      
      const [update] = await db.insert(permeateTaskUpdates).values(updateData).returning();
      
      res.json(update);
    } catch (error) {
      console.error("Error submitting task update:", error);
      res.status(500).json({ error: "Failed to submit task update" });
    }
  });

  // Approve or reject task update
  app.patch("/api/permeate/task-updates/:updateId", async (req, res) => {
    try {
      const updateId = req.params.updateId;
      const { approvalStatus, approvedBy, approvalNotes } = req.body;
      
      const [update] = await db.update(permeateTaskUpdates)
        .set({ 
          approvalStatus,
          approvedBy,
          approvalNotes,
        })
        .where(eq(permeateTaskUpdates.id, updateId))
        .returning();
      
      // If approved, update the main task
      if (approvalStatus === 'approved') {
        const taskUpdate = await db.select().from(permeateTaskUpdates)
          .where(eq(permeateTaskUpdates.id, updateId));
        
        if (taskUpdate.length > 0) {
          await db.update(permeateTasks)
            .set({
              status: taskUpdate[0].status,
              score: taskUpdate[0].score,
              statusNotes: taskUpdate[0].notes,
              updatedAt: new Date()
            })
            .where(eq(permeateTasks.id, taskUpdate[0].taskId));
        }
      }
      
      res.json(update);
    } catch (error) {
      console.error("Error updating task approval:", error);
      res.status(500).json({ error: "Failed to update task approval" });
    }
  });
}

// Helper functions
async function determinePermeateRole(employeeData: any): Promise<string> {
  const role = (employeeData.role || "").toLowerCase();
  const department = (employeeData.department || "").toLowerCase();
  
  if (role.includes('ceo') || role.includes('president') || role.includes('director')) {
    return 'organization_leader';
  }
  if (role.includes('manager') || role.includes('lead') || role.includes('supervisor')) {
    return 'project_leader';
  }
  if (role.includes('admin') || department.includes('it') || department.includes('hr')) {
    return 'administrator';
  }
  return 'team_member';
}

function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString('hex');
}

function buildOrganizationChart(employees: PermeateEmployee[]) {
  // Create a map for quick lookup
  const employeeMap = new Map(employees.map(emp => [emp.email, emp]));
  
  // Find root employees (no manager or manager not in system)
  const roots = employees.filter(emp => 
    !emp.managerEmail || !employeeMap.has(emp.managerEmail)
  );
  
  // Build tree structure recursively
  function buildTree(employee: PermeateEmployee): any {
    const children = employees.filter(emp => emp.managerEmail === employee.email);
    return {
      ...employee,
      children: children.map(child => buildTree(child))
    };
  }
  
  return roots.map(root => buildTree(root));
}

async function findBestEmployeeForTask(task: any, employees: PermeateEmployee[]): Promise<PermeateEmployee | null> {
  // Simple algorithm - can be enhanced with AI
  const taskSkills = task.requiredSkills || [];
  
  let bestEmployee = null;
  let bestScore = -1;
  
  for (const employee of employees) {
    if (employee.permeateRole === 'team_member' || employee.permeateRole === 'project_leader') {
      let score = 0;
      
      // Skill matching
      const employeeSkills = employee.skills || [];
      const matchingSkills = taskSkills.filter((skill: string) => 
        employeeSkills.some(empSkill => 
          empSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      score += matchingSkills.length * 10;
      
      // Role preference
      if (task.preferredRole && employee.permeateRole === task.preferredRole) {
        score += 20;
      }
      
      // Department matching
      if (task.department && employee.department === task.department) {
        score += 15;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestEmployee = employee;
      }
    }
  }
  
  return bestEmployee;
}