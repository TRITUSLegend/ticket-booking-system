'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/60 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`block w-full rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm px-3 py-2 ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
