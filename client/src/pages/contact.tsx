import LegalLayout from "./legal-layout";
import { Mail, MapPin, Globe } from "lucide-react";

export default function ContactPage() {
  return (
    <LegalLayout title="Contact Us">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "var(--ds-info-bg)" }}>
            <Mail className="h-5 w-5" style={{ color: "var(--ds-imperial)" }} />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ color: "var(--ds-text)" }}>Email</h3>
            <a href="mailto:hello@regintel.darkstreet.tech" className="text-[14px]" style={{ color: "var(--ds-gold)" }}>
              hello@regintel.darkstreet.tech
            </a>
            <p className="text-[13px] mt-1" style={{ color: "var(--ds-text-muted)" }}>For general inquiries and support</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "var(--ds-info-bg)" }}>
            <Mail className="h-5 w-5" style={{ color: "var(--ds-imperial)" }} />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ color: "var(--ds-text)" }}>Sales</h3>
            <a href="mailto:david@darkstreet.org" className="text-[14px]" style={{ color: "var(--ds-gold)" }}>
              david@darkstreet.org
            </a>
            <p className="text-[13px] mt-1" style={{ color: "var(--ds-text-muted)" }}>For enterprise and partnership inquiries</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "var(--ds-info-bg)" }}>
            <MapPin className="h-5 w-5" style={{ color: "var(--ds-imperial)" }} />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ color: "var(--ds-text)" }}>Address</h3>
            <p className="text-[14px]" style={{ color: "var(--ds-text-secondary)" }}>
              Dark Street Tech<br />
              Remote-first company
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "var(--ds-info-bg)" }}>
            <Globe className="h-5 w-5" style={{ color: "var(--ds-imperial)" }} />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ color: "var(--ds-text)" }}>Website</h3>
            <p className="text-[14px]" style={{ color: "var(--ds-text-secondary)" }}>darkstreet.tech</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-2" style={{ borderColor: "var(--ds-border)" }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--ds-text)", fontFamily: "'Playfair Display', serif" }}>Response Times</h2>
        <ul className="space-y-2 text-[14px]">
          <li><strong>General inquiries:</strong> 1-2 business days</li>
          <li><strong>Technical support (Pilot):</strong> Email support, 1 business day</li>
          <li><strong>Technical support (Professional):</strong> Priority support, same business day</li>
          <li><strong>Technical support (Enterprise):</strong> Dedicated support with SLA</li>
        </ul>
      </div>
    </LegalLayout>
  );
}
