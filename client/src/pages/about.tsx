import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function About() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 section-divider bg-gradient-to-br from-surface-white via-surface-light to-surface-grey">
          <div className="container-section">
            <div className="max-w-4xl">
              <h1 className="text-responsive-md text-primary mb-8 font-light tracking-tight">
                About Dark Street Tech
              </h1>
              <p className="text-responsive-xxl text-secondary font-light leading-relaxed">
                AI-powered solutions for growing enterprises.
              </p>
              <div className="mt-12 w-24 h-px bg-gradient-to-r from-accent-blue to-transparent"></div>
            </div>
          </div>
        </section>

        <div className="container-section py-6 space-y-6">
          <Card className="bg-white">
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Dark Street Tech is dedicated to developing cutting-edge AI-powered solutions that transform how organizations process, analyze, and understand information. We believe in making advanced technology accessible and practical for everyday business needs.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>FetchPatterns</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Our flagship product, FetchPatterns, represents the future of document analysis. Using state-of-the-art AI models, it provides:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Intelligent Document Processing:</strong> Extract insights from PDFs, Word documents, presentations, and images</li>
              <li><strong>Advanced Sentiment Analysis:</strong> Understand emotional tone and context within your documents</li>
              <li><strong>Question Answering:</strong> Get specific answers from your document collection</li>
              <li><strong>Visual Analytics:</strong> Interactive word clouds and sentiment breakdowns</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Our Technology</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>We leverage the latest advancements in artificial intelligence, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Large Language Models (LLMs) for natural language understanding</li>
              <li>Computer vision for image and document processing</li>
              <li>Machine learning algorithms for pattern recognition</li>
              <li>Cloud-native architecture for scalability and reliability</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Leadership</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p><strong>Barsha Panda - CEO</strong><br/>
            Business strategist with experience of working around the world, in technology organizations, spanning services, consumer internet (Yahoo), and enterprise tech (Oracle).</p>
            
            <p><strong>David Jairaj - COO</strong><br/>
            Process and tech architect with expeience in working in diverse fields such as art, design, product development, performance measurement.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Email:</strong> hello@darkstreet.org<br/>
              <strong>Website:</strong> darkstreet.tech
            </p>
          </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}