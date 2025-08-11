import React from 'react';
import { clsx } from 'clsx';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        'relative w-full rounded-lg border p-4',
        {
          'border-gray-200 bg-white text-gray-950': variant === 'default',
          'border-red-200 bg-red-50 text-red-900': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={clsx('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}