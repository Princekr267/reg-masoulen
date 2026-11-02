import React from 'react';

/* ------------------------------------------------------------------ */
/*  SVG icons — kept inline so no packages are needed                 */
/* ------------------------------------------------------------------ */

const icons: Record<string, React.ReactNode> = {
  /* Magnifying glass — Logical Reasoning */
  logic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.1" y1="15.1" x2="21" y2="21" />
    </svg>
  ),

  /* Padlock — Cybersecurity */
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),

  /* Eye — OSINT */
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),

  /* Key — Cryptography */
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="8" cy="15" r="5" />
      <path d="M11.7 11.3 21 2" />
      <path d="M18 5l3-3" />
      <path d="M16 7l2-2" />
    </svg>
  ),

  /* Map pin — Geospatial Analysis */
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),

  /* Fingerprint — Digital Forensics */
  fingerprint: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38-.16 4.42-.46 6.38" />
      <path d="M17.6 9.9a6 6 0 0 0-11.18-.14" />
      <path d="M6.38 12.2a4 4 0 0 1 7.98-.52" />
      <path d="M9.9 17.66a10 10 0 0 1-.14-1.66c0-.82.06-1.7.2-2.6" />
      <path d="M20 11.46c.04.5.04 1 0 1.54a17 17 0 0 1-.8 4.5" />
      <path d="M4 15.5a15 15 0 0 1-.34-3.5 8 8 0 0 1 1.66-4.87" />
    </svg>
  ),

  /* Open book — Research Skills */
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Domain data                                                        */
/* ------------------------------------------------------------------ */

interface Domain {
  name: string;
  description: string;
  icon: React.ReactNode;
}

const DOMAINS: Domain[] = [
  {
    name: 'Logical Reasoning',
    description: 'Untangle contradictions and false alibis with rigorous deductive analysis.',
    icon: icons.logic,
  },
  {
    name: 'Cybersecurity',
    description: 'Breach firewalls, trace intrusions, and expose digital cover-ups.',
    icon: icons.lock,
  },
  {
    name: 'OSINT',
    description: 'Harvest publicly available intelligence to unmask suspects hiding in plain sight.',
    icon: icons.eye,
  },
  {
    name: 'Cryptography',
    description: 'Crack ciphers and encrypted communiqués that conceal the killer\'s motives.',
    icon: icons.key,
  },
  {
    name: 'Geospatial Analysis',
    description: 'Map crime scenes, trace escape routes, and correlate location evidence.',
    icon: icons.mapPin,
  },
  {
    name: 'Digital Forensics',
    description: 'Recover deleted artefacts, examine metadata, and reconstruct timelines.',
    icon: icons.fingerprint,
  },
  {
    name: 'Research Skills',
    description: 'Dig through archives, cross-reference records, and verify every lead.',
    icon: icons.book,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const InvestigatorsToolkit: React.FC = () => {
  return (
    <section className="relative bg-noir-bg py-20 px-6 overflow-hidden">
      {/* Grain overlay — same as InvestigationProtocol */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Section heading — mirrors InvestigationProtocol style */}
        <div className="text-center mb-16">
          <h2 className="font-noir text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-noir-heading mb-3">
            The Investigator's Toolkit
          </h2>
          <p className="text-sm sm:text-base text-noir-body uppercase tracking-[0.2em]">
            Skills required to crack the case
          </p>
          <div className="mt-6 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-noir-blood to-transparent" />
        </div>

        {/* Cards grid — 1 col mobile, 2 col sm, 3 col lg.
            The 7th card is centered via justify-items-center on the grid. */}
        <div className="flex flex-wrap justify-center gap-5">
          {DOMAINS.map((domain) => (
            <div
              key={domain.name}
             className="group relative w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)] rounded border border-noir-border/60 bg-noir-card/80 px-5 py-5 sm:px-6 sm:py-6 transition-all duration-300 hover:border-noir-blood/50 hover:bg-noir-card-hover/90 hover:shadow-[0_0_24px_rgba(139,0,0,0.12)]"
            >
              {/* Top-left docket hole — tiny decorative detail */}
              <div className="absolute top-2.5 right-3 w-1.5 h-1.5 rounded-full bg-noir-border/50" />

              {/* Icon */}
              <div className="mb-4 text-noir-blood-bright transition-colors duration-300 group-hover:text-noir-blood">
                {domain.icon}
              </div>

              {/* Title */}
              <h3 className="font-noir text-base sm:text-lg font-bold text-noir-title tracking-wide mb-1.5 transition-colors duration-300 group-hover:text-noir-blood-bright">
                {domain.name}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-noir-body">
                {domain.description}
              </p>

              {/* Bottom accent line — appears on hover */}
              <div className="absolute bottom-0 left-4 right-4 h-px bg-noir-blood/0 transition-all duration-300 group-hover:bg-noir-blood/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InvestigatorsToolkit;
