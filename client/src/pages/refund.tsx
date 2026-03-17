import LegalLayout from "./legal-layout";

export default function RefundPage() {
  return (
    <LegalLayout title="Refund and Cancellation Policy">
      <p><strong>Effective Date:</strong> March 1, 2026</p>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>1. Subscription Cancellation</h2>
        <p>You may cancel your RegIntel subscription at any time through your account settings. Upon cancellation, you will retain access to the Service until the end of your current billing period. No further charges will be made after cancellation.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>2. Refund Policy</h2>
        <p>We offer a full refund within <strong>7 days</strong> of your initial subscription purchase if you are not satisfied with the Service. To request a refund, contact us at <a href="mailto:hello@regintel.darkstreet.tech" style={{ color: "var(--ds-gold)" }}>hello@regintel.darkstreet.tech</a> with your account details.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>3. Refund Processing</h2>
        <p>Approved refunds will be processed through your original payment method (Razorpay) within 5-10 business days. The exact timing depends on your bank or card issuer.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>4. Non-Refundable Items</h2>
        <p>The following are not eligible for refunds: (a) subscriptions beyond the 7-day refund window; (b) partial month usage; (c) Intelligence units already consumed; (d) custom enterprise integrations or professional services.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>5. Plan Changes</h2>
        <p>You may upgrade or downgrade your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the start of the next billing period.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>6. Contact</h2>
        <p>For refund requests or billing questions, contact us at <a href="mailto:hello@regintel.darkstreet.tech" style={{ color: "var(--ds-gold)" }}>hello@regintel.darkstreet.tech</a>.</p>
      </section>
    </LegalLayout>
  );
}
