import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, User } from "lucide-react";
import RegTechLayout from "./layout";
import { apiRequest, queryClient } from "@/lib/queryClient";

const JURISDICTIONS = [
  { id: 'US', label: 'United States' },
  { id: 'UK', label: 'United Kingdom' },
  { id: 'EU', label: 'European Union' },
  { id: 'IN', label: 'India' },
  { id: 'SG', label: 'Singapore' },
  { id: 'HK', label: 'Hong Kong' },
  { id: 'AU', label: 'Australia' },
  { id: 'CA', label: 'Canada' },
  { id: 'GLOBAL', label: 'Global' },
];

const REGULATORS = [
  { id: 'FATF', label: 'FATF' },
  { id: 'FinCEN', label: 'FinCEN (US)' },
  { id: 'FCA', label: 'FCA (UK)' },
  { id: 'MAS', label: 'MAS (Singapore)' },
  { id: 'FIU-IND', label: 'FIU-IND (India)' },
  { id: 'AUSTRAC', label: 'AUSTRAC (Australia)' },
  { id: 'FINTRAC', label: 'FINTRAC (Canada)' },
  { id: 'EBA', label: 'EBA (EU)' },
  { id: 'HKMA', label: 'HKMA (Hong Kong)' },
];

const TOPICS = [
  { id: 'CDD', label: 'Customer Due Diligence' },
  { id: 'KYC', label: 'Know Your Customer' },
  { id: 'Transaction Monitoring', label: 'Transaction Monitoring' },
  { id: 'Sanctions Screening', label: 'Sanctions Screening' },
  { id: 'PEP Screening', label: 'PEP Screening' },
  { id: 'Record Keeping', label: 'Record Keeping' },
  { id: 'Reporting', label: 'Suspicious Activity Reporting' },
  { id: 'Risk Assessment', label: 'Risk Assessment' },
];

export default function ProfilePage() {
  const { toast } = useToast();
  
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [selectedRegulators, setSelectedRegulators] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const { data } = useQuery<{ profile: any }>({
    queryKey: ['/api/regtech/profile'],
  });

  const profile = data?.profile;

  useEffect(() => {
    if (profile) {
      setSelectedJurisdictions(profile.jurisdictions || []);
      setSelectedRegulators(profile.regulators || []);
      setSelectedTopics(profile.topics || []);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data: { jurisdictions: string[]; regulators: string[]; topics: string[] }) => {
      await apiRequest('/api/regtech/profile', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/profile'] });
      toast({
        title: "Success",
        description: "Your preferences have been saved",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      jurisdictions: selectedJurisdictions,
      regulators: selectedRegulators,
      topics: selectedTopics,
    });
  };

  const toggleJurisdiction = (id: string) => {
    setSelectedJurisdictions(prev =>
      prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
    );
  };

  const toggleRegulator = (id: string) => {
    setSelectedRegulators(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <RegTechLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your alert preferences and monitoring settings
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>
                Select the jurisdictions, regulators, and topics you want to monitor. 
                You'll receive proactive alerts when relevant regulations are published or updated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Jurisdictions */}
              <div>
                <h3 className="font-semibold mb-3">Jurisdictions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {JURISDICTIONS.map((jurisdiction) => (
                    <div key={jurisdiction.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`jurisdiction-${jurisdiction.id}`}
                        checked={selectedJurisdictions.includes(jurisdiction.id)}
                        onCheckedChange={() => toggleJurisdiction(jurisdiction.id)}
                        data-testid={`checkbox-jurisdiction-${jurisdiction.id}`}
                      />
                      <Label
                        htmlFor={`jurisdiction-${jurisdiction.id}`}
                        className="cursor-pointer"
                      >
                        {jurisdiction.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulators */}
              <div>
                <h3 className="font-semibold mb-3">Regulators</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {REGULATORS.map((regulator) => (
                    <div key={regulator.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`regulator-${regulator.id}`}
                        checked={selectedRegulators.includes(regulator.id)}
                        onCheckedChange={() => toggleRegulator(regulator.id)}
                        data-testid={`checkbox-regulator-${regulator.id}`}
                      />
                      <Label
                        htmlFor={`regulator-${regulator.id}`}
                        className="cursor-pointer"
                      >
                        {regulator.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <h3 className="font-semibold mb-3">Topics of Interest</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TOPICS.map((topic) => (
                    <div key={topic.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic.id}`}
                        checked={selectedTopics.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                        data-testid={`checkbox-topic-${topic.id}`}
                      />
                      <Label
                        htmlFor={`topic-${topic.id}`}
                        className="cursor-pointer"
                      >
                        {topic.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                {saveMutation.isPending ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Alerts Work</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                • When a new regulatory document matching your preferences is uploaded, you'll receive an alert
              </p>
              <p>
                • When an existing document is updated, you'll be notified of the changes
              </p>
              <p>
                • Alerts include impact scores and action items based on identified obligations
              </p>
              <p>
                • If you don't select any topics, you'll receive alerts for all obligations in matching documents
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RegTechLayout>
  );
}
