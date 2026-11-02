import React, { useState } from 'react';

interface Category {
  id: string;
  label: string;
  tagline: string;
  items: string[];
}

const CATEGORIES: Category[] = [
  {
    id: 'registration',
    label: 'Team Registration',
    tagline: 'Who may enter the investigation.',
    items: [
      'Each team must have exactly 4 members.',
      'Every participant can register with only one team.',
      'Team changes are not permitted once the event begins.',
    ],
  },
  {
    id: 'campus',
    label: '48-Hour Campus Stay',
    tagline: 'Once the case begins, you stay on site.',
    items: [
      'Participants must remain on campus throughout the 48-hour event.',
      'Leaving campus is not permitted except in emergencies coordinated with the organizers.',
      'Bring clothes, toiletries, necessary medications, and other overnight essentials.',
    ],
  },
  {
    id: 'food',
    label: 'Food & Beverages',
    tagline: 'Even detectives need to eat.',
    items: [
      'Meals will not be provided by the organizers.',
      'Participants can purchase food from campus canteens at their own expense, subject to operating hours.',
      'Packed meals, snacks, and beverages are allowed.',
    ],
  },
  {
    id: 'equipment',
    label: 'Mandatory Equipment',
    tagline: 'Come prepared.',
    items: [
      'Bring your own laptop, charger, and necessary accessories.',
      'Every team MUST bring at least one extension board. Extension boards will not be provided.',
      'Carry a valid college ID or government-issued photo ID.',
      'Use electrical equipment safely and avoid overloading sockets.',
    ],
  },
  {
    id: 'conduct',
    label: 'Fair Play & Conduct',
    tagline: 'Play fair or leave the case.',
    items: [
      'Cheating, plagiarism, sharing restricted solutions, and disrupting other teams are prohibited.',
      'Respect fellow participants, organizers, and campus property.',
      'Harassment, misconduct, alcohol, and prohibited substances are strictly forbidden.',
    ],
  },
  {
    id: 'general',
    label: 'General Instructions',
    tagline: 'The final word of the bureau.',
    items: [
      "Follow event schedules, submission deadlines, and organizers' instructions.",
      'Stay within permitted campus areas and report emergencies immediately.',
      "Rule violations may result in disqualification. Organizers' decisions on event matters will be final.",
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
        <p className="mt-4 text-center text-xs italic text-noir-body/70">
          By registering, participants agree to follow the event rules and guidelines.
        </p>
      </div>
    </section>
  );
};

export default CodeOfSilence;