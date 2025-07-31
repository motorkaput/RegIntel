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
  
  const handleLogout = () => {
    sessionStorage.removeItem("perMeateBetaAuth");
    sessionStorage.removeItem("perMeateCurrentUser");
    if (onLogout) onLogout();
    window.location.href = "/z9m3k/pe-beta-login";
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
      {/* Tier 1: Main PerMeaTe Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 h-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo and Branding */}
            <div className="flex items-center space-x-3">
              <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  PerMeaTe Enterprise
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                  Turn goals into real, measurable work.
                </span>
              </div>
            </div>

            {/* User Controls */}
            <div className="flex items-center space-x-4">
              {currentUser && (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentUser.name}
                      </span>
                      <div className="flex items-center space-x-1 -mt-0.5">
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          {currentUser.userType.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {currentUser.employeeId}
                        </span>
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
                  PerMeaTe Enterprise Beta Access
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tier 2: Function Tabs (if enabled) */}
      {showFunctionTabs && (
        <div className="sticky top-12 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 h-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-12">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'goals', label: 'Goals', icon: '🎯' },
                  { id: 'projects', label: 'Projects', icon: '📋' },
                  { id: 'analytics', label: 'Analytics', icon: '📈' },
                  { id: 'users', label: 'Users', icon: '👥' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
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