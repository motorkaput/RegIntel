import { storage } from "./storage";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

export async function initializeAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "david@darkstreet.org";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.log("ADMIN_PASSWORD not set, skipping admin initialization");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const existingAdmin = await storage.getUserByEmail(adminEmail);

    if (existingAdmin) {
      // Always sync password and admin flag from env
      await storage.updateUserAdmin(existingAdmin.id, hashedPassword);
      console.log("Admin user synced:", adminEmail);
    } else {
      await storage.createUser({
        id: nanoid(),
        email: adminEmail,
        password: hashedPassword,
        firstName: "David",
        lastName: "Admin",
        isAdmin: true,
        subscriptionStatus: "active",
        trialEndsAt: null,
      });
      console.log("Admin user created:", adminEmail);
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
}
