import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Security() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Security & Compliance</h1>
          <p className="text-gray-600 text-sm">Your data security is our top priority</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Dark Street Tech implements enterprise-grade security measures to protect your data:</p>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Encryption</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>All data transmitted using TLS 1.3 encryption</li>
              <li>Data at rest encrypted using AES-256</li>
              <li>End-to-end encryption for sensitive document processing</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">Access Controls</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Multi-factor authentication (MFA) required</li>
              <li>Role-based access control (RBAC)</li>
              <li>Regular access audits and reviews</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Infrastructure Security</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">SOC 2 Type II</Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">ISO 27001</Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">GDPR Compliant</Badge>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">HIPAA Ready</Badge>
            </div>

            <h3 className="text-lg font-semibold mb-2">Cloud Infrastructure</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Hosted on secure cloud platforms with 99.9% uptime SLA</li>
              <li>Automated backup and disaster recovery</li>
              <li>Network isolation and firewalls</li>
              <li>Regular security patches and updates</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Document Processing Security</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-2">Secure Processing</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Documents processed in isolated, secure environments</li>
              <li>No permanent storage of document content after analysis</li>
              <li>Automatic purging of processed data within 24 hours</li>
              <li>AI processing occurs in encrypted memory spaces</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">Data Retention</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Analysis results stored only as long as needed</li>
              <li>User-controlled data deletion capabilities</li>
              <li>Automatic expiration of session data</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Compliance & Certifications</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>We maintain compliance with major security and privacy frameworks:</p>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-semibold text-gray-900">Current Certifications</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>SOC 2 Type II (Annual)</li>
                  <li>ISO 27001:2013</li>
                  <li>GDPR Compliance</li>
                  <li>CCPA Compliance</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Industry Standards</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>NIST Cybersecurity Framework</li>
                  <li>OWASP Security Guidelines</li>
                  <li>CSA Cloud Controls Matrix</li>
                  <li>FedRAMP Ready</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Security Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <ul className="list-disc pl-6 space-y-1">
              <li>24/7 security monitoring and incident response</li>
              <li>Real-time threat detection and prevention</li>
              <li>Regular penetration testing and vulnerability assessments</li>
              <li>Security incident reporting within 72 hours</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Report Security Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p>If you discover a security vulnerability, please report it to:</p>
            <p className="font-semibold text-gray-900 mt-2">security@darkstreet.tech</p>
            <p className="text-sm text-gray-600 mt-2">
              We take all security reports seriously and will respond within 24 hours. 
              For urgent security matters, please include "URGENT" in your subject line.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}