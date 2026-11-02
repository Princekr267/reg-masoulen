import React from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Receive the Case File',
    description:
      'At the stroke of midnight, every team is handed a sealed problem statement — your first and only lead.',
  },
  {
    number: 2,
    title: 'Investigate',
    description:
      'Decode ciphers, trace digital footprints, and piece together the evidence before the trail goes cold.',
  },
  {
    number: 3,
    title: 'Prepare the Dossier',
    description:
      'Compile your findings into a structured PDF — your official case report to the bureau.',
  },
  {
    number: 4,
    title: 'Submit',
    description:
      'Upload your dossier before the deadline. Late submissions are treated as cold cases — permanently.',
  },
  {
    number: 5,
    title: 'Evaluation',
    description:
      'A panel of senior investigators scores your report on accuracy, depth, and presentation.',
  },
  {
    number: 6,
    title: 'Qualification',
    description:
      'Top-scoring teams are cleared for the next round. The rest? Their cases remain unsolved.',
  },
];

export const InvestigationProtocol: React.FC = () => {
  return (
    <section id="protocol" className="relative z-10 w-full bg-transparent py-20 px-4 sm:px-6">
      <div className="relative max-w-3xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-[#220305] border border-[#881337] text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#ff3b47] font-semibold mb-4 shadow-md">
            <span>✦</span>
            <span>CHRONOLOGY OF EVENTS</span>
            <span>✦</span>
          </div>

          <h2 className="font-gothic text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-[#180305] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] mb-3">
            The Investigation Protocol
          </h2>

          <p className="font-serif text-sm sm:text-base text-[#4a080c] uppercase tracking-[0.22em] font-semibold">
            How the 48-hour case unfolds
          </p>

          {/* Ornate gothic divider */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#b0121b]" />
            <span className="text-xs text-[#b0121b]">✦</span>
            <div className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#b0121b]" />
          </div>
        </div>

        {/* Forensic Timeline */}
        <div className="relative">
          {/* Glowing Red Thread — Forensic Crime String */}
          <div className="absolute left-5 sm:left-8 top-2 bottom-4 w-[2px] bg-gradient-to-b from-transparent via-[#e51a24] to-transparent filter drop-shadow-[0_0_6px_rgba(229,26,36,0.6)]" />

          <ol className="relative space-y-8 sm:space-y-10">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="group relative pl-14 sm:pl-20"
              >
                {/* Forensic Red Pin / Number Badge */}
                <div className="absolute left-2.5 sm:left-5.5 top-2.5 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#e51a24] bg-[#220305] text-xs font-gothic font-bold text-[#ff3b47] shadow-[0_0_10px_rgba(229,26,36,0.6)] transition-all duration-300 group-hover:bg-[#b0121b] group-hover:text-white group-hover:scale-110">
                  {step.number}
                </div>

                {/* Content Card (Deep Dark Card with Crisp Legible Light Text) */}
                <div className="rounded-lg border border-[#3a0608] bg-[#120204]/95 px-6 py-5 sm:px-7 sm:py-6 transition-all duration-300 shadow-xl shadow-black/50 group-hover:border-[#b0121b] group-hover:bg-[#1a0307] group-hover:shadow-[0_0_24px_rgba(229,26,36,0.25)] backdrop-blur-md">
                  <h3 className="font-gothic text-base sm:text-lg font-bold text-[#f5e6d3] tracking-wider transition-colors duration-300 group-hover:text-[#ff3b47]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 font-serif text-sm sm:text-[15px] leading-relaxed text-[#d8c5b2]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Terminal sealing pin at the end of the thread */}
          <div className="absolute left-[18px] sm:left-[30px] -bottom-1 w-3 h-3 rounded-full border border-[#ff3b47] bg-[#b0121b] shadow-[0_0_10px_rgba(229,26,36,0.9)]" />
        </div>
      </div>
    </section>
  );
};

export default InvestigationProtocol;
