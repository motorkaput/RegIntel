import { cn } from "@/lib/utils";
import LoadingSpinner from "./loading-spinner";
import logoPath from "@assets/DarkStreetTech_Logo_1752659608844.png";

interface LoadingScreenProps {
  variant?: "minimal" | "branded" | "fullscreen";
  text?: string;
  className?: string;
}

export default function LoadingScreen({ 
  variant = "minimal", 
  text = "Loading...",
  className 
}: LoadingScreenProps) {
  if (variant === "branded") {
    return (
      <div className={cn(
        "fixed inset-0 bg-surface-white flex flex-col items-center justify-center z-50",
        className
      )}>
        <div className="space-y-8">
          <div className="flex justify-center">
            <img 
              src={logoPath} 
              alt="Dark Street Tech"
              className="h-16 w-auto animate-pulse"
            />
          </div>
          <div className="space-y-4">
            <LoadingSpinner variant="dots" size="lg" />
            <p className="text-secondary font-light text-center">
              {text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className={cn(
        "fixed inset-0 bg-surface-white flex items-center justify-center z-50",
        className
      )}>
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-border rounded-full animate-spin">
              <div className="absolute inset-0 border-4 border-transparent border-t-accent-blue rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-primary">
              Dark Street Tech
            </h3>
            <p className="text-secondary font-light">
              {text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Minimal variant
  return (
    <div className={cn(
      "flex items-center justify-center py-12",
      className
    )}>
      <LoadingSpinner variant="code" text={text} size="md" />
    </div>
  );
}