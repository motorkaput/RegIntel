import { Link } from "wouter";
import { LogOut, RefreshCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import permeateIcon from "@assets/PerMeaTeEnterprise_Icon_1752664675820.png";
import { Badge } from "@/components/ui/badge";

interface PerMeaTeHeaderProps {
  currentUser?: {
    username: string;
    userType: string;
    name: string;
    employeeId: string;
  } | null;
  showFunctionTabs?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  onReOnboard?: () => void;
  showSessionControls?: boolean;
}

export default function PerMeaTeHeader({ 
  currentUser, 
  showFunctionTabs = false, 
  activeTab = "overview",
  onTabChange,
  onLogout,
  onReOnboard,
  showSessionControls = false
}: PerMeaTeHeaderProps) {
  
  // Name mapping function for display purposes
  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    
    const nameMapping: Record<string, string> = {
      'barsha@darkstreet.org': 'Barsha Panda',
      'david@darkstreet.org': 'David Jairaj', 
      'sashi@darkstreet.org': 'Sashi (Designer)',
      'dj.darkbark@gmail.com': 'DJ DarkBark',
      'shailendra.bhramhavanshi@techaroha.in': 'Shailendra Bhramhavanshi',
      'sagar.salunkhe@techaroha.in': 'Sagar Salunkhe',
      'john@darkstreet.org': 'John (Senior Programmer)'
    };
    
    return nameMapping[user.username] || nameMapping[user.name] || user.name || user.username || 'Unknown User';
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem("perMeateBetaAuth");
    sessionStorage.removeItem("perMeateCurrentUser");
    if (onLogout) onLogout();
    window.location.href = "/pe-workspace";
  };

  const handleReOnboard = () => {
    localStorage.removeItem('permeateOnboardingCompleted');
    localStorage.removeItem('permeateCompanyData');
    localStorage.removeItem('permeateEmployeeData');
    if (onReOnboard) onReOnboard();
    window.location.reload();
  };

  return (
    <>
      {/* Tier 1: Main PerMeaTe Header - Matching Fetch Patterns styling */}
      <div className="fixed z-20 w-full bg-gray-50 border-b border-gray-200 py-3" style={{top: '64px'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo and Branding - Match Fetch Patterns layout */}
            <div className="flex items-center gap-3">
              <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">PerMeaTe Enterprise</h1>
                <p className="text-gray-600 text-xs">Turn goals into real, measurable work.</p>
              </div>
            </div>

            {/* User Controls */}
            <div className="flex items-center space-x-4">
              {currentUser && (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {getDisplayName(currentUser)}
                      </span>
                      <div className="flex items-center space-x-1 -mt-0.5">
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          {currentUser.userType === 'permeate_expert' ? 'PerMeaTe Expert' : 
                           currentUser.userType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {currentUser.userType === 'administrator' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReOnboard}
                      className="h-8 px-3 text-xs"
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Re-onboard
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 px-3 text-xs"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Log Out
                  </Button>
                </>
              )}
              
              {!currentUser && showSessionControls && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Beta Access
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tier 2: Function Tabs (if enabled) */}
      {showFunctionTabs && (
        <div className="fixed z-10 w-full bg-white border-b border-gray-200 h-12" style={{top: '116px'}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-12">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'goals', label: 'Goals' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'users', label: 'Users' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}