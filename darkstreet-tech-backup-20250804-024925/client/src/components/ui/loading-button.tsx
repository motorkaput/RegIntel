import { cn } from "@/lib/utils";
import { Button } from "./button";
import LoadingSpinner from "./loading-spinner";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export default function LoadingButton({
  isLoading = false,
  loadingText,
  variant = "default",
  size = "default",
  className,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner 
          variant="dots" 
          size="sm" 
          className="mr-2"
        />
      )}
      {isLoading ? (loadingText || "Loading...") : children}
    </Button>
  );
}