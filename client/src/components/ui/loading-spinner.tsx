import { cn } from "@/lib/utils";
import iconPath from "@assets/DarkStreetTech_Icon_1752659608842.png";

interface LoadingSpinnerProps {
  variant?: "default" | "dots" | "pulse" | "code" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  variant = "default", 
  size = "md", 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center space-x-1", className)}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
        {text && (
          <span className={cn("text-secondary font-light ml-3", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <div className={cn("rounded-full border-2 border-accent-blue animate-pulse", sizeClasses[size])}></div>
          <div className={cn("absolute inset-0 rounded-full border-2 border-accent-blue animate-ping", sizeClasses[size])}></div>
        </div>
        {text && (
          <span className={cn("text-secondary font-light ml-3", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "code") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-accent-blue animate-pulse" style={{ animationDelay: "0ms" }}></div>
            <div className="w-1 h-4 bg-accent-blue animate-pulse" style={{ animationDelay: "200ms" }}></div>
            <div className="w-1 h-4 bg-accent-blue animate-pulse" style={{ animationDelay: "400ms" }}></div>
          </div>
          <div className="font-mono text-xs text-secondary animate-pulse">
            {text || "Processing..."}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
        <div className="relative">
          <img 
            src={iconPath} 
            alt="Dark Street Tech"
            className={cn("animate-spin", sizeClasses[size])}
            style={{ animationDuration: "2s" }}
          />
        </div>
        {text && (
          <span className={cn("text-secondary font-light", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <div className={cn(
          "rounded-full border-2 border-border animate-spin",
          sizeClasses[size]
        )}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-blue"></div>
        </div>
      </div>
      {text && (
        <span className={cn("text-secondary font-light ml-3", textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
}