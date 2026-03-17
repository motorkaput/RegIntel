import LegalLayout from "./legal-layout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p><strong>Effective Date:</strong> March 1, 2026</p>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>1. Information We Collect</h2>
        <p><strong>Account Information:</strong> Name, email address, organization name, and role when you create an account.</p>
        <p className="mt-2"><strong>Usage Data:</strong> We collect information about how you use the Service, including pages visited, features used, and session duration.</p>
        <p className="mt-2"><strong>Documents:</strong> Regulatory documents you upload for analysis. These are processed by our AI systems and stored securely.</p>
        <p className="mt-2"><strong>Payment Information:</strong> Payment details are processed securely by Razorpay. We do not store full credit card numbers.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>2. How We Use Your Information</h2>
        <p>We use your information to: (a) provide and improve the Service; (b) process payments; (c) send service-related communications; (d) analyze usage patterns to improve our AI models; (e) comply with legal obligations.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>3. Data Security</h2>
        <p>We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, and access controls. Your documents are stored in secure, encrypted databases.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>4. Data Sharing</h2>
        <p>We do not sell your personal information. We may share data with: (a) service providers (hosting, payment processing); (b) AI model providers for document analysis (content is not used for model training); (c) law enforcement when required by law.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>5. Data Retention</h2>
        <p>We retain your account data and uploaded documents for the duration of your subscription. Upon account deletion, your data will be permanently removed within 30 days.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>6. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>7. Your Rights</h2>
        <p>You have the right to: (a) access your personal data; (b) correct inaccurate data; (c) request deletion of your data; (d) export your data; (e) withdraw consent. Contact us to exercise these rights.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>8. Contact</h2>
        <p>For privacy inquiries, contact us at <a href="mailto:hello@regintel.darkstreet.tech" style={{ color: "var(--ds-gold)" }}>hello@regintel.darkstreet.tech</a>.</p>
      </section>
    </LegalLayout>
  );
}
