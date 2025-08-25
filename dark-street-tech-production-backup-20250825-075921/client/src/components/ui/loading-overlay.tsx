import { cn } from "@/lib/utils";
import LoadingSpinner from "./loading-spinner";

interface LoadingOverlayProps {
  isLoading: boolean;
  variant?: "default" | "dots" | "pulse" | "code" | "icon";
  text?: string;
  className?: string;
  children: React.ReactNode;
}

export default function LoadingOverlay({
  isLoading,
  variant = "default",
  text,
  className,
  children
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-surface-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingSpinner variant={variant} text={text} size="lg" />
        </div>
      )}
    </div>
  );
}