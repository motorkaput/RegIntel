import { storage } from "./storage";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { db } from "./db";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializeAdminUser() {
  try {
    const adminEmail = "david@darkstreet.org";
    const adminPassword = "43g1n73l!";
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      // Check if the user needs to be updated with admin credentials
      if (!existingAdmin.isAdmin || !existingAdmin.password) {
        console.log("Updating existing user to admin with credentials...");
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await storage.updateUserAdmin(existingAdmin.id, hashedPassword);
        console.log("Admin user updated successfully:", adminEmail);
      } else {
        console.log("Admin user already exists with credentials");
      }
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await storage.createUser({
        id: nanoid(),
        email: adminEmail,
        password: hashedPassword,
        firstName: "David",
        lastName: "Admin",
        isAdmin: true,
      });
      console.log("Admin user created successfully:", adminEmail);
    }

    // Ensure test organization exists and test users have access
    await ensureTestOrganization();
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

async function ensureTestOrganization() {
  try {
    const testOrgId = 'org-test-001';
    const testEmails = ['ididjavajar@gmail.com', 'team@navigate-change.com', 'david@darkstreet.org'];
    
    // Ensure test organization exists
    const [existingOrg] = await db.select().from(organizations).where(
      eq(organizations.id, testOrgId)
    ).limit(1);
    
    if (!existingOrg) {
      await db.insert(organizations).values({
        id: testOrgId,
        name: 'Test Organization',
        domain: 'test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Test organization created:", testOrgId);
    }
    
    // Assign all test users to the organization
    for (const email of testEmails) {
      const user = await storage.getUserByEmail(email);
      if (user && !user.organizationId) {
        await db.update(users)
          .set({ organizationId: testOrgId })
          .where(eq(users.id, user.id));
        console.log("Assigned user to test organization:", email);
      }
    }
  } catch (error) {
    console.error("Error ensuring test organization:", error);
  }
}
