import React from 'react';
import { Link } from 'react-router-dom';
import { StatusLookup } from '../components/StatusLookup';

export const StatusPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col">
      <header className="border-b border-theme-border bg-theme-panel/70 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-theme-red">
            masoulen
          </Link>
          <nav className="flex items-center gap-4 text-xs md:text-sm">
            <Link to="/register" className="text-theme-muted hover:text-theme-text transition-colors">
              Register
            </Link>
            <Link to="/rules" className="text-theme-muted hover:text-theme-text transition-colors">
              Rules
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-xl mx-auto w-full">
        <StatusLookup />
      </main>
    </div>
  );
};

export default StatusPage;
