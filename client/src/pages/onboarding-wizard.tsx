import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Settings, Upload, Users } from "lucide-react";

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    { id: 1, title: "Basic Settings", icon: Settings, description: "Configure your organization" },
    { id: 2, title: "Upload Organization Data", icon: Upload, description: "Import employees and structure" },
    { id: 3, title: "Invite Users", icon: Users, description: "Add team members" },
  ];

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Organization Setup</h1>
          <p className="text-slate-400">Complete these steps to get your workspace ready</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center space-x-2">
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <Circle className={`h-6 w-6 ${isCurrent ? 'text-blue-400' : 'text-slate-600'}`} />
                  )}
                  <div className="text-sm">
                    <div className={`font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-slate-500 text-xs">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Setup Wizard - Coming Soon</CardTitle>
            <CardDescription className="text-slate-400">
              The organization setup wizard will guide you through configuring your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-300">This wizard will include:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Basic organization settings configuration</li>
                <li>CSV upload for employee data import</li>
                <li>User invitation and role assignment</li>
                <li>Initial project and goal setup</li>
              </ul>
              
              <div className="pt-4">
                <Button 
                  onClick={() => setCurrentStep(Math.min(currentStep + 1, steps.length))}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-next-step"
                >
                  Continue Setup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}