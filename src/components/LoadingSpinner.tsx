import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  inline?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label,
  inline = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-red-600/20 border-t-red-600 rounded-full animate-spin shrink-0 ${className}`}
      role="status"
      aria-label={label || 'WAIT WEBSITE IS COOKING SOMETHING FOR U'}
    />
  );

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        {spinner}
        <span className="text-xs text-zinc-600 font-mono font-bold tracking-wide uppercase">
          {label || 'WAIT WEBSITE IS COOKING SOMETHING FOR U'}
        </span>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      {spinner}
      <p className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-700">
        {label || 'WAIT WEBSITE IS COOKING SOMETHING FOR U'}
      </p>
    </div>
  );
};

export const PageLoadingState: React.FC<{ message?: string }> = ({
  message = 'WAIT WEBSITE IS COOKING SOMETHING FOR U',
}) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-sm select-none animate-pulse">
          🏎️
        </div>
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <p className="text-sm sm:text-base font-black tracking-tight text-zinc-900 uppercase font-mono">
          {message}
        </p>
        <p className="text-xs text-zinc-500 font-mono">
          Tuning the engine & firing up the vault...
        </p>
      </div>
    </div>
  );
};

