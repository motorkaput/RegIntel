import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">About Dark Street Tech</h1>
          <p className="text-gray-600 text-sm">AI-Powered Solutions for Modern Enterprises</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
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
            <p><strong>Barsha Panda</strong> - Co-Founder & Chief Technology Officer<br/>
            Specialist in AI and machine learning systems with extensive experience in enterprise software development.</p>
            
            <p><strong>David Jairaj</strong> - Co-Founder & Chief Executive Officer<br/>
            Visionary leader with a background in product strategy and technology innovation.</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Email:</strong> info@darkstreet.tech<br/>
              <strong>Support:</strong> support@darkstreet.tech<br/>
              <strong>Website:</strong> darkstreet.tech
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}