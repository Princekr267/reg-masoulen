import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConfig, type GetConfigResponse } from '../services/api';
import { calculateCountdown, type CountdownState } from '../lib/utils';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';

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
    <div className="relative min-h-screen text-theme-text flex flex-col">
      {/* Fixed Non-Scrolling Background for the entire website */}
      <div className="fixed-site-bg" aria-hidden="true" />

      {/* Mobile-Only Dark Crimson Splatter, Cracks & Vignette Perimeter Frame */}
      <div className="fixed-mobile-vignette pointer-events-none fixed inset-0 z-[2] block md:hidden" aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Ornate Gothic Sticky Navbar */}
        <Navbar />

        {/* Hero Section matching Reference Mockup */}
        <Hero isClosed={isClosed} />

        {/* About & Details Section (Transparent on scroll to preserve continuous background) */}
        <section id="about" className="relative z-10 w-full bg-transparent py-16 px-6">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            <div className="inline-block px-3 py-1 rounded bg-gothic-maroon/60 border border-[#b0121b]/40 text-xs uppercase tracking-widest text-gothic-bright-red font-semibold mb-6">
              Murder-Mystery Hackathon
            </div>

            <h2 className="font-gothic text-3xl sm:text-5xl font-bold tracking-wider text-[#f5e6d3] mb-4">
              The Investigation
            </h2>

            <p className="font-serif text-lg md:text-xl text-[#3a0608] max-w-2xl mb-10 leading-relaxed font-semibold">
              A 48-hour murder-mystery hackathon where technology meets forensic investigation. Solve clues, decode puzzles, and build technical solutions in Delhi.
            </p>

            {/* Quick Highlights */}
            <div id="details" className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mb-10 text-left">
              <div className="bg-[#180507]/75 border border-[#3a0608] p-3.5 rounded shadow-lg backdrop-blur-sm">
                <span className="text-xs text-parchment-dark block font-medium font-serif">Dates</span>
                <span className="text-sm font-bold text-parchment-light font-gothic">21–22 Nov 2026</span>
              </div>
              <div className="bg-[#180507]/75 border border-[#3a0608] p-3.5 rounded shadow-lg backdrop-blur-sm">
                <span className="text-xs text-parchment-dark block font-medium font-serif">Location</span>
                <span className="text-sm font-bold text-parchment-light font-gothic">Delhi</span>
              </div>
              <div className="bg-[#180507]/75 border border-[#3a0608] p-3.5 rounded shadow-lg backdrop-blur-sm">
                <span className="text-xs text-parchment-dark block font-medium font-serif">Entry</span>
                <span className="text-sm font-bold text-gothic-bright-red font-gothic">Free</span>
              </div>
              <div className="bg-[#180507]/75 border border-[#3a0608] p-3.5 rounded shadow-lg backdrop-blur-sm">
                <span className="text-xs text-parchment-dark block font-medium font-serif">Eligibility</span>
                <span className="text-sm font-bold text-parchment-light font-gothic">Ages 16 to 30</span>
              </div>
            </div>

            {/* Countdown Box */}
            {countdown && !countdown.isClosed && (
              <div className="bg-[#180507]/75 border border-[#b0121b]/40 p-6 rounded-lg w-full max-w-md mb-8 shadow-xl backdrop-blur-sm shadow-black/60">
                <p className="text-xs text-gothic-bright-red uppercase tracking-widest font-gothic font-semibold mb-4 text-glow-red-sm">
                  Case Closes In
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[#100304]/90 border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-gothic-bright-red block">
                      {countdown.days}
                    </span>
                    <span className="text-[10px] uppercase text-parchment-dark">Days</span>
                  </div>
                  <div className="bg-[#100304]/90 border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-gothic-bright-red block">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase text-parchment-dark">Hours</span>
                  </div>
                  <div className="bg-[#100304]/90 border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-gothic-bright-red block">
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase text-parchment-dark">Mins</span>
                  </div>
                  <div className="bg-[#100304]/90 border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-gothic-bright-red block">
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase text-parchment-dark">Secs</span>
                  </div>
                </div>
              </div>
            )}

            {isClosed && (
              <div className="bg-[#180507]/80 border border-gothic-red p-4 rounded max-w-md w-full mb-8 backdrop-blur-sm">
                <p className="text-sm font-semibold text-gothic-bright-red">Registration is currently closed.</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              {!isClosed ? (
                <Link
                  to="/register"
                  className="px-8 py-3 rounded bg-gothic-red hover:bg-gothic-bright-red text-white font-gothic tracking-wider font-semibold text-sm transition-all shadow-lg hover:shadow-[0_0_15px_rgba(229,26,36,0.7)]"
                >
                  Register Team
                </Link>
              ) : (
                <Link
                  to="/status"
                  className="px-8 py-3 rounded bg-[#180507]/80 hover:bg-[#220305] border border-[#3a0608] text-parchment font-semibold text-sm transition-colors backdrop-blur-sm"
                >
                  Check Registration Status
                </Link>
              )}
              <Link
                to="/rules"
                className="px-6 py-3 rounded border border-[#3a0608] hover:border-gothic-red bg-[#180507]/60 text-parchment font-semibold text-sm transition-colors backdrop-blur-sm"
              >
                Read Rules
              </Link>
              <Link
                to="/status"
                className="px-6 py-3 rounded text-[#4a080c] hover:text-[#180507] font-bold text-sm transition-colors"
              >
                Check Status
              </Link>
            </div>

            {/* Venue & Eligibility Dossier */}
            <div id="faq" className="max-w-xl bg-[#180507]/75 border border-[#3a0608] p-5 rounded text-xs text-parchment-light leading-relaxed text-left shadow-lg backdrop-blur-sm">
              <strong className="block mb-1 font-gothic text-sm text-[#ff3b47]">
                Important Dossier Notes:
              </strong>
              Venue is in Delhi (exact location shared privately with confirmed teams). There is no accommodation, no food, and no merch provided. All participants must be aged 16 to 30 on 21 November 2026 and must carry a valid photo ID (school/college ID) at entry. Teams must consist of exactly 4 members.
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#3a0608]/40 bg-transparent py-6 text-center text-xs text-parchment-dark">
          <p className="font-serif">MASOULEN '26 &bull; The Case That Never Happened &bull; Delhi</p>
          <p className="mt-1 text-[11px] text-[#881337]">Inquiries: masoulen.hack@gmail.com</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
