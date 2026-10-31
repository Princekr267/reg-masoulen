import React from 'react';
import { Link } from 'react-router-dom';
import { rulesData } from '../data/rules';

export const RulesPage: React.FC = () => {
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
            <Link to="/status" className="text-theme-muted hover:text-theme-text transition-colors">
              Status
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-theme-red">{rulesData.title}</h1>
          <p className="text-xs text-theme-muted mt-1">
            masoulen | Murder-Mystery Hackathon | 21–22 November 2026, Delhi
          </p>
        </div>

        <div className="space-y-6">
          {rulesData.sections.map((section, idx) => (
            <section
              key={idx}
              className="bg-theme-panel border border-theme-border p-5 rounded space-y-2"
            >
              <h2 className="text-lg font-semibold text-theme-text border-b border-theme-border pb-1.5">
                {section.title}
              </h2>
              <div className="text-sm text-theme-muted leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-theme-border text-xs">
          <Link to="/" className="text-theme-muted hover:text-theme-text transition-colors">
            &larr; Back to Home
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded bg-theme-red hover:bg-theme-red-hover text-white font-medium transition-colors"
          >
            Register Team
          </Link>
        </div>
      </main>
    </div>
  );
};

export default RulesPage;
