import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className = '', children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-theme-muted mb-1">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={`w-full px-3 py-2 bg-theme-panel border rounded text-theme-text focus:outline-none focus:border-theme-red transition-colors ${
            error ? 'border-theme-red' : 'border-theme-border'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-theme-red-light">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
