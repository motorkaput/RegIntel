import LegalLayout from "./legal-layout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p><strong>Effective Date:</strong> March 1, 2026</p>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>1. Acceptance of Terms</h2>
        <p>By accessing or using RegIntel ("Service"), operated by Dark Street Tech ("Company", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>2. Description of Service</h2>
        <p>RegIntel is an AI-powered regulatory intelligence platform that provides document analysis, obligation extraction, web alert monitoring, and compliance tools for regulated industries. The Service is provided on a subscription basis.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>3. User Accounts</h2>
        <p>You must provide accurate, complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. Notify us immediately of any unauthorized use.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>4. Subscriptions and Payment</h2>
        <p>Paid subscriptions are billed on a recurring monthly or annual basis. Payments are processed through Razorpay. You authorize us to charge your payment method for the subscription fees. All fees are non-refundable except as described in our Refund Policy.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>5. Acceptable Use</h2>
        <p>You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to any systems; (c) reverse engineer the Service; (d) share your account credentials; (e) use the Service to store or transmit malicious code.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>6. Intellectual Property</h2>
        <p>The Service, including its AI models, analysis algorithms, and design, is the intellectual property of Dark Street Tech. Your subscription grants you a limited, non-exclusive license to use the Service. You retain ownership of your uploaded documents.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>7. AI Disclaimer</h2>
        <p>RegIntel Intelligence provides AI-generated analysis for informational purposes only. It does not constitute legal, compliance, or professional advice. Always consult qualified professionals before making compliance decisions based on AI-generated content.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>8. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Dark Street Tech shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>9. Termination</h2>
        <p>We may terminate or suspend your account at any time for violation of these terms. You may cancel your subscription at any time through your account settings.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>10. Contact</h2>
        <p>For questions about these Terms, contact us at <a href="mailto:hello@regintel.darkstreet.tech" style={{ color: "var(--ds-gold)" }}>hello@regintel.darkstreet.tech</a>.</p>
      </section>
    </LegalLayout>
  );
}
