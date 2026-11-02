import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConfig, type GetConfigResponse } from '../services/api';
import { calculateCountdown, type CountdownState } from '../lib/utils';
import InvestigationProtocol from '../components/sections/InvestigationProtocol';

export const LandingPage: React.FC = () => {
  const [config, setConfig] = useState<GetConfigResponse | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [countdown, setCountdown] = useState<CountdownState | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadConfig() {
      const res = await getConfig();
      if (!mounted) return;
      if (res.success) {
        setConfig(res);
        const offset = res.serverTime ? new Date(res.serverTime).getTime() - Date.now() : 0;
        setServerOffsetMs(offset);
        if (res.regCloseAt) {
          setCountdown(calculateCountdown(res.regCloseAt, offset));
        }
      }
    }
    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config?.regCloseAt) return;
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(config.regCloseAt, serverOffsetMs));
    }, 1000);
    return () => clearInterval(interval);
  }, [config?.regCloseAt, serverOffsetMs]);

  const isClosed = config ? !config.open || countdown?.isClosed : false;

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col">
      {/* Navbar */}
      <header className="border-b border-theme-border bg-theme-panel/70 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-theme-red">masoulen</span>
          <nav className="flex items-center gap-4 text-xs md:text-sm">
            {!isClosed && (
              <Link to="/register" className="text-theme-muted hover:text-theme-text transition-colors">
                Register
              </Link>
            )}
            <Link to="/rules" className="text-theme-muted hover:text-theme-text transition-colors">
              Rules
            </Link>
            <Link to="/status" className="text-theme-muted hover:text-theme-text transition-colors">
              Status
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center text-center">
        <div className="inline-block px-3 py-1 rounded bg-theme-panel border border-theme-border text-xs uppercase tracking-widest text-theme-red font-semibold mb-6">
          Murder-Mystery Hackathon
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-theme-text mb-4">
          masoulen
        </h1>

        <p className="text-lg md:text-xl text-theme-muted max-w-2xl mb-8 leading-relaxed">
          A 24-hour murder-mystery hackathon where technology meets investigation. Solve clues, decode puzzles, and build solutions in Delhi.
        </p>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mb-10 text-left">
          <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
            <span className="text-xs text-theme-muted block font-medium">Dates</span>
            <span className="text-sm font-bold text-theme-text">21–22 Nov 2026</span>
          </div>
          <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
            <span className="text-xs text-theme-muted block font-medium">Location</span>
            <span className="text-sm font-bold text-theme-text">Delhi</span>
          </div>
          <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
            <span className="text-xs text-theme-muted block font-medium">Entry</span>
            <span className="text-sm font-bold text-theme-red">Free</span>
          </div>
          <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
            <span className="text-xs text-theme-muted block font-medium">Eligibility</span>
            <span className="text-sm font-bold text-theme-text">Ages 16 to 30</span>
          </div>
        </div>

        {/* Countdown Box */}
        {countdown && !countdown.isClosed && (
          <div className="bg-theme-panel border border-theme-border p-6 rounded-lg w-full max-w-md mb-8">
            <p className="text-xs text-theme-muted uppercase tracking-wider font-semibold mb-4">
              Registration Closes In
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-theme-surface border border-theme-border p-2.5 rounded">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-theme-red block">
                  {countdown.days}
                </span>
                <span className="text-[10px] uppercase text-theme-muted">Days</span>
              </div>
              <div className="bg-theme-surface border border-theme-border p-2.5 rounded">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-theme-red block">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase text-theme-muted">Hours</span>
              </div>
              <div className="bg-theme-surface border border-theme-border p-2.5 rounded">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-theme-red block">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase text-theme-muted">Mins</span>
              </div>
              <div className="bg-theme-surface border border-theme-border p-2.5 rounded">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-theme-red block">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase text-theme-muted">Secs</span>
              </div>
            </div>
          </div>
        )}

        {isClosed && (
          <div className="bg-theme-panel border border-theme-border p-4 rounded max-w-md w-full mb-8">
            <p className="text-sm font-semibold text-theme-red">Registration is currently closed.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {!isClosed ? (
            <Link
              to="/register"
              className="px-8 py-3 rounded bg-theme-red hover:bg-theme-red-hover text-white font-semibold text-sm transition-colors shadow-lg"
            >
              Register Team
            </Link>
          ) : (
            <Link
              to="/status"
              className="px-8 py-3 rounded bg-theme-surface hover:bg-theme-panel border border-theme-border text-theme-text font-semibold text-sm transition-colors"
            >
              Check Registration Status
            </Link>
          )}
          <Link
            to="/rules"
            className="px-6 py-3 rounded border border-theme-border hover:border-theme-muted text-theme-text font-semibold text-sm transition-colors"
          >
            Read Rules
          </Link>
          <Link
            to="/status"
            className="px-6 py-3 rounded text-theme-muted hover:text-theme-text font-semibold text-sm transition-colors"
          >
            Check Status
          </Link>
        </div>

        {/* Venue Warning Notice */}
        <div className="max-w-xl bg-theme-panel/60 border border-theme-border p-4 rounded text-xs text-theme-muted leading-relaxed text-left">
          <strong className="text-theme-text block mb-1">Important Details:</strong>
          Venue is in Delhi (exact venue shared with confirmed teams). There is no accommodation, no food, and no merch provided. All participants must be aged 16 to 30 on 21 November 2026 and must carry a valid photo ID (school/college ID) at entry. Teams must consist of exactly 4 members.
        </div>
      </main>

      <InvestigationProtocol />

      {/* Footer */}
      <footer className="border-t border-theme-border py-6 text-center text-xs text-theme-muted">
        <p>masoulen 2026 &bull; Delhi &bull; Inquiries: masoulen.hack@gmail.com</p>
      </footer>
    </div>
  );
};

export default LandingPage;
