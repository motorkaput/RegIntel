import Razorpay from "razorpay";
import crypto from "crypto";
import type { SubscriptionPlan } from "@shared/schema";

let razorpayInstance: Razorpay;

export function initializeRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;

  if (!keyId || !keySecret) {
    console.warn('Razorpay credentials not configured. Payment features will be unavailable.');
    return;
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function ensureRazorpay(): Razorpay {
  if (!razorpayInstance) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
  }
  return razorpayInstance;
}

export async function createSubscription(plan: SubscriptionPlan) {
  try {
    const rp = ensureRazorpay();
    const subscriptionData = {
      plan_id: plan.id,
      customer_notify: 1 as 0 | 1,
      quantity: 1,
      total_count: 12, // 12 months
      start_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Start after 30-day trial
      addons: [],
      notes: {
        plan_name: plan.name,
        description: plan.description,
      },
    };

    const subscription = await rp.subscriptions.create(subscriptionData);
    return subscription;
  } catch (error) {
    console.error("Error creating Razorpay subscription:", error);
    throw new Error("Failed to create subscription");
  }
}

export async function createOrder(amount: number, currency: string = "USD") {
  try {
    const rp = ensureRazorpay();
    if (amount <= 0) throw new Error("Order amount must be positive");

    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise/cents
      currency,
      receipt: `order_${Date.now()}`,
      notes: {
        created_at: new Date().toISOString(),
      },
    };

    const order = await rp.orders.create(orderData);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Failed to create order");
  }
}

export function verifyPayment(paymentId: string, subscriptionId: string, signature: string): boolean {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;
    if (!keySecret) {
      console.error("Razorpay key secret not configured. Cannot verify payment.");
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return false;
  }
}

export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const subscription = await ensureRazorpay().subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    throw new Error("Failed to fetch subscription details");
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await ensureRazorpay().subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}
