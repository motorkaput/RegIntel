import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DynamicHero from "@/components/dynamic-hero";

export default function Contact() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      <main className="pt-20">
        <DynamicHero 
          title="Contact Us" 
          subtitle="Get in touch with our team" 
        />

        <div className="container-section py-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">Name</label>
                  <Input placeholder="Your name" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Email</label>
                  <Input type="email" placeholder="your.email@example.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Subject</label>
                  <Input placeholder="How can we help?" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Message</label>
                  <Textarea 
                    placeholder="Tell us more about your inquiry..." 
                    className="mt-1 min-h-[120px]" 
                  />
                </div>
                <Button className="w-full bg-gray-700 hover:bg-gray-800">
                  Send Message
                </Button>
              </form>
            </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}