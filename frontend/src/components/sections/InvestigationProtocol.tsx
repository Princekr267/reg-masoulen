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

const InvestigationProtocol: React.FC = () => {
  return (
    <section className="relative bg-[#0d0a08] py-20 px-6 overflow-hidden">
      {/* Subtle background noise / grain texture via CSS */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative max-w-3xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#f5f0e8] mb-3"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            The Investigation Protocol
          </h2>
          <p className="text-sm sm:text-base text-[#8a8070] uppercase tracking-[0.2em]">
            How the case unfolds
          </p>
          {/* Decorative rule */}
          <div className="mt-6 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-[#8B0000] to-transparent" />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical red thread — the evidence-board string */}
          <div className="absolute left-5 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#8B0000]/0 via-[#8B0000] to-[#8B0000]/0" />

          <ol className="relative space-y-10 sm:space-y-12">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="group relative pl-14 sm:pl-20"
              >
                {/* Pin / number on the red line */}
                <div className="absolute left-2.5 sm:left-5 top-0.5 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#8B0000] bg-[#0d0a08] text-[10px] sm:text-xs font-bold text-[#B91C1C] transition-all duration-300 group-hover:bg-[#8B0000] group-hover:text-[#f5f0e8] group-hover:shadow-[0_0_12px_rgba(139,0,0,0.5)]">
                  {step.number}
                </div>

                {/* Content card */}
                <div className="rounded border border-[#2a2218]/60 bg-[#14110e]/80 px-5 py-4 sm:px-6 sm:py-5 transition-all duration-300 group-hover:border-[#8B0000]/40 group-hover:bg-[#1a1510]/90 group-hover:shadow-[0_0_20px_rgba(139,0,0,0.08)]">
                  <h3
                    className="text-base sm:text-lg font-bold text-[#e8dcc8] tracking-wide transition-colors duration-300 group-hover:text-[#B91C1C]"
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#8a8070]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Terminal dot at the bottom of the thread */}
          <div className="absolute left-[18px] sm:left-[29px] -bottom-1 w-2.5 h-2.5 rounded-full bg-[#8B0000] shadow-[0_0_8px_rgba(139,0,0,0.6)]" />
        </div>
      </div>
    </section>
  );
};

export default InvestigationProtocol;
