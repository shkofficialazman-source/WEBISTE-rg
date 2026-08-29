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
      aria-label={label || 'Loading'}
    />
  );

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        {spinner}
        {label && <span className="text-xs text-zinc-600 font-medium">{label}</span>}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      {spinner}
      {label && <p className="text-xs text-zinc-500 font-medium">{label}</p>}
    </div>
  );
};

export const PageLoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
      <div className="w-8 h-8 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-zinc-700">{message}</p>
    </div>
  );
};
