import React from 'react';

export interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;
  return <p className={`mt-1 text-xs text-theme-red-light ${className}`}>{error}</p>;
};
