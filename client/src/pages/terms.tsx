import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      <main className="pt-16">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-gray-600 text-sm">Last updated: July 21, 2025</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>By accessing and using Dark Street Tech's services, including FetchPatterns, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Service Description</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>FetchPatterns is an AI-powered document analysis platform that provides:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Document processing and text extraction</li>
              <li>Sentiment analysis and classification</li>
              <li>Question answering based on document content</li>
              <li>Context-based sentiment analysis</li>
              <li>Word cloud generation and visualization</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service only for lawful purposes</li>
              <li>Not upload malicious, copyrighted, or sensitive content without authorization</li>
              <li>Respect usage limits associated with your subscription plan</li>
              <li>Keep your account credentials secure</li>
              <li>Not attempt to reverse engineer or compromise our services</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Subscription and Billing</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Our services are provided on a subscription basis. Payment is required in advance for each billing period. We reserve the right to modify pricing with 30 days notice.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Dark Street Tech shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>For questions about these Terms of Service, contact us at hello@darkstreet.org</p>
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}