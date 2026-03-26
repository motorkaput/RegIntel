import { storage } from "../storage";
import { scanAlertSet } from "./webAlertScanner";
import { log } from "../vite";

const SCAN_CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes
let isRunning = false;

async function sendAlertNotification(userEmail: string, alertCount: number, alertSetName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const appUrl = process.env.OAUTH_REDIRECT_BASE || "https://regintel.darkstreet.tech";
    await resend.emails.send({
      from: "RegIntel <hello@darkstreet.org>",
      to: userEmail,
      subject: `[RegIntel] ${alertCount} new regulatory alert${alertCount > 1 ? "s" : ""} — ${alertSetName}`,
      html: `
        <div style="font-family:'Inter',sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#001D51;font-family:'Playfair Display',serif;font-size:24px;margin:0;">regintel</h1>
            <p style="color:#666;font-size:12px;margin:4px 0 0;">by Dark Street Tech</p>
          </div>
          <p style="color:#333;font-size:14px;line-height:1.6;">
            Your alert set <strong>"${alertSetName}"</strong> found <strong>${alertCount} new regulatory update${alertCount > 1 ? "s" : ""}</strong>.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${appUrl}/regtech/alerts" style="background:#001D51;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View Alerts</a>
          </div>
          <p style="color:#999;font-size:12px;">You're receiving this because you have active alert monitoring in RegIntel.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/>
          <p style="color:#999;font-size:11px;text-align:center;">
            <a href="https://darkstreet.tech" style="color:#D4AF37;">darkstreet.tech</a> &middot; hello@darkstreet.org
          </p>
        </div>`,
    });
  } catch (error) {
    console.error("Failed to send alert notification:", error);
  }
}

async function runScheduledScans() {
  if (isRunning) {
    log("Scheduler: Previous scan still running, skipping", "scheduler");
    return;
  }

  isRunning = true;
  try {
    const dueAlertSets = await storage.getAlertSetsDueForScan();
    if (dueAlertSets.length === 0) {
      return;
    }

    log(`Scheduler: ${dueAlertSets.length} alert set(s) due for scanning`, "scheduler");

    for (const alertSet of dueAlertSets) {
      try {
        log(`Scheduler: Scanning "${alertSet.name}" (${alertSet.cadence}, user ${alertSet.userId})`, "scheduler");

        const alerts = await scanAlertSet(alertSet);

        // Deduplicate against existing alerts
        const existingAlerts = await storage.getUserWebAlerts(alertSet.userId);
        const existingUrls = new Set(existingAlerts.map((a) => a.sourceUrl));
        const newAlerts = alerts.filter((a) => !existingUrls.has(a.sourceUrl ?? null));

        if (newAlerts.length > 0) {
          await storage.createWebAlerts(newAlerts);
          log(`Scheduler: Found ${newAlerts.length} new alert(s) for "${alertSet.name}"`, "scheduler");

          // Send email notification
          const user = await storage.getUser(alertSet.userId);
          if (user?.email) {
            await sendAlertNotification(user.email, newAlerts.length, alertSet.name);
          }
        } else {
          log(`Scheduler: No new alerts for "${alertSet.name}"`, "scheduler");
        }

        // Mark as scanned
        await storage.updateWebAlertSetLastScanned(alertSet.id);

        // Small delay between sets to avoid rate limiting
        await new Promise((r) => setTimeout(r, 2000));
      } catch (error: any) {
        console.error(`Scheduler: Error scanning alert set "${alertSet.name}":`, error.message);
      }
    }
  } catch (error) {
    console.error("Scheduler: Error in scheduled scan:", error);
  } finally {
    isRunning = false;
  }
}

export function startScheduler() {
  log("Regulatory feed scheduler started (checking every 15 min)", "scheduler");

  // Run initial check after 60 seconds (let server fully boot)
  setTimeout(() => {
    runScheduledScans().catch(console.error);
  }, 60 * 1000);

  // Then check every 15 minutes
  setInterval(() => {
    runScheduledScans().catch(console.error);
  }, SCAN_CHECK_INTERVAL_MS);
}

// Manual trigger for admin
export async function triggerScanAll(): Promise<{ scanned: number; alertsFound: number }> {
  const allSets = await storage.getAllActiveAlertSets();
  let totalAlerts = 0;

  for (const alertSet of allSets) {
    try {
      const alerts = await scanAlertSet(alertSet);
      const existingAlerts = await storage.getUserWebAlerts(alertSet.userId);
      const existingUrls = new Set(existingAlerts.map((a) => a.sourceUrl));
      const newAlerts = alerts.filter((a) => !existingUrls.has(a.sourceUrl ?? null));

      if (newAlerts.length > 0) {
        await storage.createWebAlerts(newAlerts);
        totalAlerts += newAlerts.length;
      }
      await storage.updateWebAlertSetLastScanned(alertSet.id);
    } catch (error: any) {
      console.error(`Manual scan error for "${alertSet.name}":`, error.message);
    }
  }

  return { scanned: allSets.length, alertsFound: totalAlerts };
}
