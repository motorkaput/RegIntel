import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      <main className="pt-20">
        <section className="py-6 section-divider">
          <div className="container-section">
            <div className="space-y-4">
              <h1 className="text-responsive-md text-primary">Contact Us</h1>
              <p className="text-responsive-xl text-secondary font-light">Get in touch with our team</p>
            </div>
          </div>
        </section>

        <div className="container-section py-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">General Inquiries</h3>
                <p className="text-gray-600">hello@darkstreet.org</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Technical Support</h3>
                <p className="text-gray-600">hello@darkstreet.org</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sales</h3>
                <p className="text-gray-600">hello@darkstreet.org</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Partnership</h3>
                <p className="text-gray-600">hello@darkstreet.org</p>
              </div>
            </CardContent>
            </Card>

            <Card className="bg-white">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
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

          <Card className="bg-white">
          <CardHeader>
            <CardTitle>Office Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Business Hours</h3>
                <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM (EST)</p>
                <p className="text-gray-600">Saturday - Sunday: Closed</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Emergency Support</h3>
                <p className="text-gray-600">24/7 support available for enterprise customers</p>
                <p className="text-gray-600">Contact: hello@darkstreet.org</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}