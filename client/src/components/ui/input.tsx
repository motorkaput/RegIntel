import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={clsx(
        'flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        // Default light theme styles
        'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 ring-offset-white focus-visible:ring-blue-500',
        // Dark theme overrides (inherit from parent component styling)
        className
      )}
      {...props}
    />
  );
}