'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-deep)] disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'btn-primary text-white focus:ring-blue-500',
      secondary: 'bg-white/[0.07] text-white border border-white/10 hover:bg-white/[0.12] focus:ring-white/20 transition-colors duration-150',
      danger: 'bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25 hover:text-red-200 hover:shadow-glow-red focus:ring-red-500/40 transition-all duration-150',
      ghost: 'bg-transparent text-white/60 hover:bg-white/[0.06] hover:text-white/90 focus:ring-white/20 transition-colors duration-150',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
