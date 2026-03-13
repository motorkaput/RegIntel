import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "text" | "card" | "avatar" | "button" | "table" | "page";
  rows?: number;
  className?: string;
}

export default function LoadingSkeleton({
  variant = "text",
  rows = 3,
  className
}: LoadingSkeletonProps) {
  const shimmer = "bg-slate-200 animate-pulse rounded";

  if (variant === "page") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
          <div className={cn(shimmer, "h-7 w-48")} />
          <div className={cn(shimmer, "h-4 w-72")} />
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={cn(shimmer, "h-10 w-10 rounded-lg")} />
              <div className="flex-1 space-y-2">
                <div className={cn(shimmer, "h-4 w-full")} />
                <div className={cn(shimmer, "h-3 w-2/3")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={cn(shimmer, "w-10 h-10 rounded-lg")} />
              <div className="flex-1 space-y-2">
                <div className={cn(shimmer, "h-4")} />
                <div className={cn(shimmer, "h-3 w-2/3")} />
              </div>
            </div>
            <div className="space-y-2">
              <div className={cn(shimmer, "h-3")} />
              <div className={cn(shimmer, "h-3 w-5/6")} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("bg-white rounded-2xl border border-slate-200 overflow-hidden", className)}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className={cn(shimmer, "h-9 w-48")} />
          <div className={cn(shimmer, "h-9 w-32")} />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className={cn(shimmer, "h-4 w-4/12")} />
              <div className={cn(shimmer, "h-4 w-2/12")} />
              <div className={cn(shimmer, "h-4 w-2/12")} />
              <div className={cn(shimmer, "h-4 w-1/12")} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <div className={cn(shimmer, "w-12 h-12 rounded-full")} />
        <div className="flex-1 space-y-2">
          <div className={cn(shimmer, "h-4")} />
          <div className={cn(shimmer, "h-3 w-2/3")} />
        </div>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={cn(shimmer, "h-10")} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={cn(shimmer, "h-4")} />
          <div className={cn(shimmer, "h-4 w-5/6")} />
        </div>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return <LoadingSkeleton variant="page" rows={5} />;
}

export function TableLoadingSkeleton() {
  return <LoadingSkeleton variant="table" rows={8} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}
