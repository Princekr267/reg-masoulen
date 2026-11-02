import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConfig, type GetConfigResponse } from '../services/api';
import { calculateCountdown, type CountdownState } from '../lib/utils';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import InvestigationProtocol from '../components/sections/InvestigationProtocol';
import InvestigatorsToolkit from '../components/sections/InvestigatorsToolkit';
import CodeOfSilence from '../components/sections/CodeOfSilence';
import emblemImg from '../assets/masoulen/emblem.webp';

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
        <section id="about" className="relative z-10 w-full bg-transparent py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            {/* Dark Gothic Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-[#220305] border border-[#881337] text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#ff3b47] font-semibold mb-4 shadow-md">
              <span>✦</span>
              <span>MURDER-MYSTERY HACKATHON</span>
              <span>✦</span>
            </div>

            {/* High-Contrast Dark Title on Parchment */}
            <h2 className="font-gothic text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-[#180305] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] mb-3">
              The Investigation
            </h2>

            {/* Deep Crimson Subtitle */}
            <p className="font-serif text-sm sm:text-base text-[#4a080c] uppercase tracking-[0.22em] font-semibold mb-4">
              48 Hours • Forensic Technology • One Unsolved Mystery
            </p>

            {/* Ornate gothic divider */}
            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#b0121b]" />
              <span className="text-xs text-[#b0121b]">✦</span>
              <div className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#b0121b]" />
            </div>

            {/* Description Text with high contrast */}
            <p className="font-serif text-base sm:text-lg md:text-xl text-[#180305] font-semibold max-w-2xl mb-10 leading-relaxed drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
              A 48-hour murder-mystery hackathon where technology meets forensic investigation. Solve clues, decode puzzles, and build technical solutions in Delhi.
            </p>

            {/* Quick Highlights Dossier Cards (Deep Dark Red / Black with crisp light text) */}
            <div id="details" className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mb-10 text-left">
              <div className="bg-[#120204]/95 border border-[#3a0608] hover:border-[#b0121b] p-4 rounded-lg shadow-xl shadow-black/40 backdrop-blur-md transition-colors">
                <span className="text-xs text-[#d8c5b2] block font-serif uppercase tracking-wider">Dates</span>
                <span className="text-sm sm:text-base font-bold text-[#f5e6d3] font-gothic mt-0.5 block">21–22 Nov 2026</span>
              </div>
              <div className="bg-[#120204]/95 border border-[#3a0608] hover:border-[#b0121b] p-4 rounded-lg shadow-xl shadow-black/40 backdrop-blur-md transition-colors">
                <span className="text-xs text-[#d8c5b2] block font-serif uppercase tracking-wider">Location</span>
                <span className="text-sm sm:text-base font-bold text-[#f5e6d3] font-gothic mt-0.5 block">Delhi, India</span>
              </div>
              <div className="bg-[#120204]/95 border border-[#3a0608] hover:border-[#b0121b] p-4 rounded-lg shadow-xl shadow-black/40 backdrop-blur-md transition-colors">
                <span className="text-xs text-[#d8c5b2] block font-serif uppercase tracking-wider">Entry</span>
                <span className="text-sm sm:text-base font-bold text-[#ff3b47] font-gothic mt-0.5 block">Free Entry</span>
              </div>
              <div className="bg-[#120204]/95 border border-[#3a0608] hover:border-[#b0121b] p-4 rounded-lg shadow-xl shadow-black/40 backdrop-blur-md transition-colors">
                <span className="text-xs text-[#d8c5b2] block font-serif uppercase tracking-wider">Eligibility</span>
                <span className="text-sm sm:text-base font-bold text-[#f5e6d3] font-gothic mt-0.5 block">Ages 16 to 30</span>
              </div>
            </div>

            {/* Countdown Box */}
            {countdown && !countdown.isClosed && (
              <div className="bg-[#120204]/95 border border-[#b0121b]/80 p-6 rounded-lg w-full max-w-md mb-8 shadow-2xl shadow-black/70 backdrop-blur-md">
                <p className="text-xs text-[#ff3b47] uppercase tracking-[0.25em] font-gothic font-semibold mb-4 text-glow-red-sm">
                  ✦ Case Closes In ✦
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="bg-[#080102] border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-[#ff3b47] block">
                      {countdown.days}
                    </span>
                    <span className="text-[10px] uppercase font-serif text-[#d8c5b2]">Days</span>
                  </div>
                  <div className="bg-[#080102] border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-[#ff3b47] block">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase font-serif text-[#d8c5b2]">Hours</span>
                  </div>
                  <div className="bg-[#080102] border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-[#ff3b47] block">
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase font-serif text-[#d8c5b2]">Mins</span>
                  </div>
                  <div className="bg-[#080102] border border-[#3a0608] p-2.5 rounded">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-[#ff3b47] block">
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase font-serif text-[#d8c5b2]">Secs</span>
                  </div>
                </div>
              </div>
            )}

            {isClosed && (
              <div className="bg-[#120204]/95 border border-[#b0121b] p-4 rounded max-w-md w-full mb-8 backdrop-blur-md">
                <p className="text-sm font-semibold text-[#ff3b47] font-gothic tracking-wider">Registration is currently closed.</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              {!isClosed ? (
                <Link
                  to="/register"
                  className="px-8 py-3 rounded bg-gradient-to-r from-[#981017] via-[#b0121b] to-[#981017] hover:from-[#b0121b] hover:to-[#e51a24] text-white font-gothic tracking-wider font-semibold text-sm transition-all shadow-lg hover:shadow-[0_0_20px_rgba(229,26,36,0.6)] active:scale-95 border border-[#ff3b47]/40"
                >
                  Register Team
                </Link>
              ) : (
                <Link
                  to="/status"
                  className="px-8 py-3 rounded bg-[#120204]/95 hover:bg-[#220305] border border-[#3a0608] hover:border-[#b0121b] text-[#f5e6d3] font-gothic font-semibold text-sm transition-colors backdrop-blur-md"
                >
                  Check Registration Status
                </Link>
              )}
              <a
                href="#rules"
                className="px-6 py-3 rounded border border-[#3a0608] hover:border-[#b0121b] bg-[#120204]/90 text-[#f5e6d3] font-gothic font-semibold text-sm transition-colors backdrop-blur-md"
              >
                Read Rules
              </a>
              <Link
                to="/status"
                className="px-6 py-3 rounded border border-transparent hover:border-[#3a0608] text-[#881337] hover:text-[#b0121b] font-gothic font-bold text-sm transition-colors"
              >
                Check Status
              </Link>
            </div>

            {/* Venue & Eligibility Dossier */}
            <div id="faq" className="max-w-xl bg-[#120204]/95 border border-[#3a0608] hover:border-[#b0121b]/50 p-6 rounded-lg text-xs text-[#e8d5c4] leading-relaxed text-left shadow-xl shadow-black/50 backdrop-blur-md">
              <strong className="block mb-2 font-gothic text-sm text-[#ff3b47] tracking-wider">
                ✦ Important Dossier Notes:
              </strong>
              Venue is in Delhi (exact location shared privately with confirmed teams). There is no accommodation, no food, and no merch provided. All participants must be aged 16 to 30 on 21 November 2026 and must carry a valid photo ID (school/college ID) at entry. Teams must consist of exactly 4 members.
            </div>
          </div>
        </section>

        {/* Investigators Toolkit Section */}
        <InvestigatorsToolkit />

        {/* Code of Silence (Rules & Regulations) Section */}
        <CodeOfSilence />

        {/* Investigation Protocol (Process & Flow) Section */}
        <InvestigationProtocol />

        {/* =========================================================================
         * GOTHIC FOOTER: Deep Dark Gothic Vault with High-Contrast Legibility
         * ========================================================================= */}
        <footer id="footer" className="relative z-10 w-full bg-[#0a0102] border-t-2 border-[#881337] pt-16 pb-12 px-4 sm:px-6 shadow-[0_-16px_50px_rgba(0,0,0,0.95)]">
          {/* Subtle top crimson glow bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#e51a24] to-transparent shadow-[0_0_10px_rgba(229,26,36,0.8)]" />

          {/* Ornate Top Divider */}
          <div className="max-w-5xl mx-auto mb-10 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#b0121b]/60 to-transparent" />
            <div className="flex items-center gap-1.5 text-[#ff3b47] text-xs">
              <span>✦</span>
              <span className="text-sm">❖</span>
              <span>✦</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#b0121b]/60 to-transparent" />
          </div>

          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            {/* Crest Emblem + Brand Title */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={emblemImg}
                alt="Masoulen Crest"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_10px_rgba(229,26,36,0.7)]"
              />
              <span className="font-gothic text-xl sm:text-2xl font-bold tracking-[0.25em] text-[#f5e6d3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                MASOULEN '26
              </span>
            </div>

            {/* Tagline */}
            <p className="font-serif text-xs sm:text-sm text-[#d8c5b2] uppercase tracking-[0.22em] mb-6">
              The Case That Never Happened • A 48-Hour Murder Mystery Hackathon
            </p>

            {/* Navigation Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 font-serif text-xs sm:text-sm uppercase tracking-widest text-[#d8c5b2]">
              <a href="#home" className="hover:text-[#ff3b47] transition-colors">Home</a>
              <span className="text-[#881337] text-[10px]">✦</span>
              <a href="#about" className="hover:text-[#ff3b47] transition-colors">About</a>
              <span className="text-[#881337] text-[10px]">✦</span>
              <a href="#details" className="hover:text-[#ff3b47] transition-colors">Details</a>
              <span className="text-[#881337] text-[10px]">✦</span>
              <a href="#toolkit" className="hover:text-[#ff3b47] transition-colors">Toolkit</a>
              <span className="text-[#881337] text-[10px]">✦</span>
              <a href="#rules" className="hover:text-[#ff3b47] transition-colors">Rules</a>
              <span className="text-[#881337] text-[10px]">✦</span>
              <a href="#protocol" className="hover:text-[#ff3b47] transition-colors">Protocol</a>
              <span className="text-[#881337] text-[10px]">✦</span>
              <Link to="/register" className="hover:text-[#ff3b47] transition-colors">Register</Link>
              <span className="text-[#881337] text-[10px]">✦</span>
              <a href="#faq" className="hover:text-[#ff3b47] transition-colors">FAQ</a>
            </nav>

            {/* Event Coordinates & Contact */}
            <div className="space-y-1.5 text-xs font-serif text-[#a39080] mb-6">
              <p>Delhi, India • 21–22 November 2026 • 48-Hour Live Investigation</p>
              <p>
                Confidential Inquiries:{' '}
                <a
                  href="mailto:masoulen.hack@gmail.com"
                  className="text-[#ff3b47] hover:underline hover:text-white transition-colors"
                >
                  masoulen.hack@gmail.com
                </a>
              </p>
            </div>

            {/* Copyright Note */}
            <p className="font-serif text-[11px] text-[#8a715a] tracking-widest uppercase">
              ✦ &copy; 2026 MASOULEN. ALL RIGHTS RESERVED. ✦
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
