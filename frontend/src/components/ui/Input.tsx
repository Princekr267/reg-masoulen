import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-theme-muted mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`w-full px-3 py-2 bg-theme-panel border rounded text-theme-text placeholder-theme-muted focus:outline-none focus:border-theme-red transition-colors ${
            error ? 'border-theme-red' : 'border-theme-border'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-theme-red-light">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
