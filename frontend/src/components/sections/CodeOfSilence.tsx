import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Content. EDIT THIS ARRAY to match the official rules.              */
/*  The text below is a draft: check it against src/data/rules.ts     */
/*  or ask the organizers before the site goes live.                  */
/* ------------------------------------------------------------------ */

interface Category {
  id: string;
  label: string;
  tagline: string;
  items: string[];
}

const CATEGORIES: Category[] = [
  {
    id: 'rules',
    label: 'Rules & Regulations',
    tagline: 'The ground rules every investigator must follow.',
    items: [
      'Teams must register before the deadline and stay within the allowed team size.',
      'Every team member must be present and active for the full 48 hours.',
      'Each team receives the same problem statement at the same moment.',
      'All work must be original. Credit any source you rely on.',
      'The decisions of the organizing committee are final.',
    ],
  },
  {
    id: 'permitted',
    label: 'Permitted Tools',
    tagline: 'Fair game in the pursuit of the truth.',
    items: [
      'Open-source intelligence tools and publicly available websites.',
      'Programming languages, scripts and standard analysis software.',
      'Search engines, public archives, maps and reference material.',
      'Documentation, textbooks and your own notes.',
      'AI assistants for understanding concepts, unless the organizers state otherwise.',
    ],
  },
  {
    id: 'prohibited',
    label: 'Prohibited Practices',
    tagline: 'Cross these lines and the case is closed on you.',
    items: [
      'Attacking, scanning or disrupting any real system or website.',
      'Sharing clues, answers or solutions with other teams.',
      'Hiring or receiving help from anyone outside your registered team.',
      'Plagiarising another team’s dossier or any published write-up.',
      'Interfering with the event platform, other participants or the evaluation.',
    ],
  },
  {
    id: 'submission',
    label: 'Submission Requirements',
    tagline: 'How your final report must reach the bureau.',
    items: [
      'Submit a single PDF dossier through the official submission channel.',
      'Include your team name, members and a clear chain of reasoning.',
      'Back every conclusion with evidence and cite your sources.',
      'Submissions must arrive before the deadline. Late files are not accepted.',
      'Only the latest submission from a team is evaluated.',
    ],
  },
  {
    id: 'disqualification',
    label: 'Disqualification Criteria',
    tagline: 'The fastest way to lose the case.',
    items: [
      'Plagiarism or copying from other teams.',
      'Breaking any rule listed under Prohibited Practices.',
      'Providing false information during registration or evaluation.',
      'Misconduct or abusive behaviour toward organizers or participants.',
      'Missing the submission deadline without prior approval.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const CodeOfSilence: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(CATEGORIES[0].id);
  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  return (
    <section className="relative bg-noir-bg py-20 px-6 overflow-hidden">
      {/* Grain overlay, same as the other noir sections */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative max-w-4xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="font-noir text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-noir-heading mb-3">
            The Code of Silence
          </h2>
          <p className="text-sm sm:text-base text-noir-body uppercase tracking-[0.2em]">
            Rules every investigator must obey
          </p>
          <div className="mt-6 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-noir-blood to-transparent" />
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Code of Silence categories"
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeId;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(cat.id)}
                className={
                  'rounded border px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all duration-300 ' +
                  (isActive
                    ? 'border-noir-blood-bright bg-noir-card-hover text-noir-heading shadow-[0_0_18px_rgba(139,0,0,0.25)]'
                    : 'border-noir-border/60 bg-noir-card/80 text-noir-body hover:border-noir-blood/50 hover:text-noir-title')
                }
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div
          role="tabpanel"
          className="relative rounded border border-noir-border/60 bg-noir-card/80 px-6 py-8 sm:px-10 sm:py-10"
        >
          <div className="absolute top-3 right-4 w-1.5 h-1.5 rounded-full bg-noir-border/50" />

          <h3 className="font-noir text-xl sm:text-2xl font-bold text-noir-title tracking-wide mb-1">
            {active.label}
          </h3>
          <p className="text-sm italic text-noir-body mb-6">{active.tagline}</p>
          <div className="mb-6 w-16 h-px bg-noir-blood/60" />

          <ul className="space-y-4">
            {active.items.map((item, index) => (
              <li key={item} className="flex items-start gap-4">
                <span className="mt-0.5 font-noir text-sm font-bold text-noir-blood-bright w-6 shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm sm:text-base leading-relaxed text-noir-body">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default CodeOfSilence;