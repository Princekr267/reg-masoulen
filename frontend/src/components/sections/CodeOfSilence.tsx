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
    label: 'Campus Conduct',
    tagline: 'Respect the grounds of the mystery.',
    items: [
      'Smoking, vaping, alcohol, and any illegal substances are strictly prohibited.',
      'Harassment, discrimination, or disruptive behaviour will result in immediate disqualification and removal.',
      'Follow all directions given by university authorities, security personnel, and event organizers.',
    ],
  },
  {
    id: 'integrity',
    label: 'Fair Play & Intellectual Property',
    tagline: 'Solve it honestly.',
    items: [
      'All solutions and submissions must be the original work of your team created during the event.',
      'Plagiarism, unauthorized collaboration, or sabotage of other teams means immediate disqualification.',
      'Teams retain full ownership of the intellectual property they build during the hackathon.',
    ],
  },
];

export const CodeOfSilence: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(CATEGORIES[0].id);
  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  return (
    <section id="rules" className="relative z-10 w-full bg-transparent py-20 px-4 sm:px-6">
      <div className="relative max-w-4xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-[#220305] border border-[#881337] text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#ff3b47] font-semibold mb-4 shadow-md">
            <span>✦</span>
            <span>BUREAU PROTOCOLS</span>
            <span>✦</span>
          </div>

          <h2 className="font-gothic text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-[#180305] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] mb-3">
            The Code of Silence
          </h2>

          <p className="font-serif text-sm sm:text-base text-[#4a080c] uppercase tracking-[0.22em] font-semibold">
            Strict rules every investigator must obey
          </p>

          {/* Ornate gothic divider */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#b0121b]" />
            <span className="text-xs text-[#b0121b]">✦</span>
            <div className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#b0121b]" />
          </div>
        </div>

        {/* Tab Selector */}
        <div
          role="tablist"
          aria-label="Code of Silence categories"
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-8"
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeId;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(cat.id)}
                className={`rounded-md border px-4 py-2 font-gothic text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all duration-300 backdrop-blur-md ${
                  isActive
                    ? 'border-[#e51a24] bg-[#220305] text-white shadow-[0_0_16px_rgba(229,26,36,0.5)] scale-105'
                    : 'border-[#3a0608] bg-[#120204]/95 text-[#f5e6d3] hover:border-[#b0121b] hover:text-[#ff3b47]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Confidential Docket Card Panel (Deep Dark with Crisp High Contrast) */}
        <div
          role="tabpanel"
          className="relative rounded-lg border border-[#3a0608] bg-[#120204]/95 px-6 py-8 sm:px-10 sm:py-10 shadow-2xl shadow-black/70 backdrop-blur-md transition-all duration-300"
        >
          {/* Top-right brass seal rivet */}
          <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full border border-[#8a715a]/70 bg-[#2b070a]" />

          <h3 className="font-gothic text-xl sm:text-2xl font-bold text-[#f5e6d3] tracking-wide mb-1.5">
            {active.label}
          </h3>
          <p className="font-serif italic text-sm text-[#ff3b47] mb-6">
            "{active.tagline}"
          </p>
          <div className="mb-6 w-20 h-px bg-gradient-to-r from-[#b0121b] to-transparent" />

          <ul className="space-y-4">
            {active.items.map((item, index) => (
              <li key={item} className="flex items-start gap-4">
                <span className="mt-0.5 font-gothic text-xs sm:text-sm font-bold text-[#ff3b47] bg-[#220305] border border-[#b0121b]/60 rounded px-2 py-0.5 shrink-0 shadow-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-serif text-sm sm:text-base leading-relaxed text-[#f5e6d3]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-center font-serif text-xs font-semibold uppercase tracking-wider text-[#4a080c]">
          ✦ By registering, participants agree to uphold and execute the code of silence ✦
        </p>
      </div>
    </section>
  );
};

export default CodeOfSilence;
