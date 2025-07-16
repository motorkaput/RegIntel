import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "text" | "card" | "avatar" | "button" | "table";
  rows?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  variant = "text", 
  rows = 3, 
  className 
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card-minimal p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-surface-grey rounded-sm animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-grey rounded animate-pulse"></div>
                <div className="h-3 bg-surface-grey rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-surface-grey rounded animate-pulse"></div>
              <div className="h-3 bg-surface-grey rounded w-5/6 animate-pulse"></div>
              <div className="h-3 bg-surface-grey rounded w-4/6 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <div className="w-12 h-12 bg-surface-grey rounded-full animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-grey rounded animate-pulse"></div>
          <div className="h-3 bg-surface-grey rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-surface-grey rounded-sm animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-surface-grey rounded animate-pulse"></div>
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3 bg-surface-grey rounded animate-pulse"></div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default text skeleton
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-surface-grey rounded animate-pulse"></div>
          <div className="h-4 bg-surface-grey rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-surface-grey rounded w-4/6 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}