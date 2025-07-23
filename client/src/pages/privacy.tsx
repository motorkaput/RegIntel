import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      <main className="pt-20">
        <section className="py-6 section-divider">
          <div className="container-section">
            <div className="space-y-4">
              <h1 className="text-responsive-md text-primary">Privacy Policy</h1>
              <p className="text-responsive-xl text-secondary font-light">Last updated: July 21, 2025</p>
            </div>
          </div>
        </section>

        <div className="container-section py-6 space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>At Dark Street Tech, we collect information you provide directly to us, such as when you create an account, upload documents, or contact us for support.</p>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Document Data</h3>
            <p>When you use FetchPatterns, we process documents you upload to provide AI-powered analysis. Documents are processed using secure AI services and are not stored permanently on our servers after analysis completion.</p>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Account Information</h3>
            <p>We collect your email address and basic profile information when you sign in through our authentication system.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our services</li>
              <li>To process and analyze documents you upload</li>
              <li>To communicate with you about service updates</li>
              <li>To improve our AI analysis capabilities</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <p>Document uploads are transmitted securely and processed using industry-standard encryption. We do not retain your document content after analysis is complete.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>If you have any questions about this Privacy Policy, please contact us at hello@darkstreet.org</p>
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}