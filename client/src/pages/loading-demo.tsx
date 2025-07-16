import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import LoadingButton from "@/components/ui/loading-button";
import LoadingOverlay from "@/components/ui/loading-overlay";
import LoadingScreen from "@/components/ui/loading-screen";

export default function LoadingDemo() {
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);

  const handleOverlayDemo = () => {
    setOverlayLoading(true);
    setTimeout(() => setOverlayLoading(false), 3000);
  };

  const handleButtonDemo = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const handleScreenDemo = () => {
    setScreenLoading(true);
    setTimeout(() => setScreenLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-16">
        <div className="container-section py-16">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-responsive-xl font-bold text-primary">
                Loading Indicators Demo
              </h1>
              <p className="text-lg text-secondary">
                Dark Street Tech animated loading components showcase
              </p>
            </div>

            {/* Spinner Variants */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-primary">Spinner Variants</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Default</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center py-8">
                    <LoadingSpinner variant="default" text="Loading..." />
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Dots</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center py-8">
                    <LoadingSpinner variant="dots" text="Processing..." />
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Pulse</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center py-8">
                    <LoadingSpinner variant="pulse" text="Analyzing..." />
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Code</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center py-8">
                    <LoadingSpinner variant="code" text="Compiling..." />
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Icon</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center py-8">
                    <LoadingSpinner variant="icon" text="Loading..." />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Skeleton Variants */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-primary">Skeleton Variants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoadingSkeleton variant="text" rows={4} />
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoadingSkeleton variant="card" rows={2} />
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Avatar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoadingSkeleton variant="avatar" />
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoadingSkeleton variant="table" rows={3} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Interactive Demos */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-primary">Interactive Demos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Loading Button</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LoadingButton
                      onClick={handleButtonDemo}
                      isLoading={buttonLoading}
                      loadingText="Processing..."
                      className="w-full btn-primary"
                    >
                      Click to Test
                    </LoadingButton>
                    <p className="text-xs text-secondary">
                      Button becomes disabled with loading indicator
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Loading Overlay</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LoadingOverlay isLoading={overlayLoading} variant="icon" text="Processing...">
                      <div className="p-6 bg-surface-light rounded border-light">
                        <p className="text-sm text-secondary">
                          This content gets overlaid with a loading indicator
                        </p>
                      </div>
                    </LoadingOverlay>
                    <Button
                      onClick={handleOverlayDemo}
                      className="w-full btn-secondary"
                    >
                      Demo Overlay
                    </Button>
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Loading Screen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-6 bg-surface-light rounded border-light">
                      <p className="text-sm text-secondary">
                        Full-screen loading experience
                      </p>
                    </div>
                    <Button
                      onClick={handleScreenDemo}
                      className="w-full btn-primary"
                    >
                      Demo Full Screen
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Code Examples */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-primary">Usage Examples</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Spinner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-surface-light p-4 rounded font-mono text-xs">
                      <code className="text-secondary">
                        {`<LoadingSpinner 
  variant="dots" 
  text="Loading..." 
  size="md" 
/>`}
                      </code>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-sm">Loading Button</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-surface-light p-4 rounded font-mono text-xs">
                      <code className="text-secondary">
                        {`<LoadingButton 
  isLoading={isLoading}
  loadingText="Processing..."
>
  Submit
</LoadingButton>`}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Full Screen Loading Demo */}
      {screenLoading && (
        <LoadingScreen 
          variant="branded" 
          text="Loading Dark Street Tech..." 
        />
      )}
    </div>
  );
}