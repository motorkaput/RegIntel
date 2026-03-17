import { storage } from "../storage";
import { scanAlertSet } from "./webAlertScanner";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Background scheduler for web alert scanning.
 * Checks all active alert sets and runs scans based on their cadence.
 * Runs every hour to check for due scans.
 */
export function startAlertScheduler() {
  if (schedulerInterval) {
    console.log("Alert scheduler already running");
    return;
  }

  console.log("Starting web alert background scheduler (hourly check)");

  // Run initial check after 30 seconds (let server fully start)
  setTimeout(() => runScheduledScans(), 30_000);

  // Then check every hour
  schedulerInterval = setInterval(() => runScheduledScans(), 60 * 60 * 1000);
}

export function stopAlertScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Alert scheduler stopped");
  }
}

async function runScheduledScans() {
  try {
    // Get all users who have alert sets (we need to iterate through user alert sets)
    // For now, we'll use a simple approach: scan alert sets that are due
    const allUsers = await storage.getAllUsers();

    for (const user of allUsers) {
      try {
        const alertSets = await storage.getUserWebAlertSets(user.id);

        for (const alertSet of alertSets) {
          if (!alertSet.isActive) continue;

          const isDue = isAlertSetDue(alertSet.cadence || "weekly", alertSet.lastScannedAt);
          if (!isDue) continue;

          console.log(`Scanning alert set "${alertSet.name}" (ID: ${alertSet.id}) for user ${user.id}`);

          try {
            const alerts = await scanAlertSet(alertSet);

            if (alerts.length > 0) {
              await storage.createWebAlerts(alerts);
              console.log(`Created ${alerts.length} new alerts for set "${alertSet.name}"`);
            }

            await storage.updateWebAlertSetLastScanned(alertSet.id);
          } catch (error) {
            console.error(`Error scanning alert set ${alertSet.id}:`, error);
            // Continue with other alert sets even if one fails
          }
        }
      } catch (error) {
        console.error(`Error processing alerts for user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Alert scheduler error:", error);
  }
}

function isAlertSetDue(cadence: string, lastScannedAt: Date | null): boolean {
  if (!lastScannedAt) return true; // Never scanned, scan now

  const now = Date.now();
  const lastScan = new Date(lastScannedAt).getTime();
  const elapsed = now - lastScan;

  switch (cadence) {
    case "daily":
      return elapsed >= 24 * 60 * 60 * 1000; // 24 hours
    case "weekly":
      return elapsed >= 7 * 24 * 60 * 60 * 1000; // 7 days
    case "monthly":
      return elapsed >= 30 * 24 * 60 * 60 * 1000; // 30 days
    default:
      return elapsed >= 7 * 24 * 60 * 60 * 1000; // Default weekly
  }
}
