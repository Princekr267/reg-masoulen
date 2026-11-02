import React from 'react';
import { Link } from 'react-router-dom';

import fullLogoWithTextImg from '../../assets/masoulen/full-logo-with-text.webp';
import detectiveImg from '../../assets/masoulen/detective.webp';
import detectiveMobileImg from '../../assets/masoulen/detective-mobile.webp';
import ravenImg from '../../assets/masoulen/raven-clean.webp';
import evidenceBoardImg from '../../assets/masoulen/evidence-board-clean.webp';
import mobileEvidenceBoardImg from '../../assets/masoulen/mobile-evidence-board.webp';
import registerBtnFrameImg from '../../assets/masoulen/register-btn-frame.webp';
import dividerTopImg from '../../assets/masoulen/divider-top.webp';
import dividerBottomImg from '../../assets/masoulen/divider-bottom.webp';
import runeCircleSvg from '../../assets/masoulen/rune-circle.svg';

interface HeroProps {
  isClosed?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ isClosed = false }) => {
  return (
    <section
      id="home"
      aria-label="Hero Section"
      className="relative min-h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-transparent flex flex-col justify-start"
    >
      {/* Background Layer: Subtle Forensic Red String Connections (Desktop SVG overlay) */}
      <svg
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block h-full w-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="28%" y1="35%" x2="50%" y2="22%" stroke="#b0121b" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="50%" y1="22%" x2="78%" y2="30%" stroke="#b0121b" strokeWidth="1" strokeDasharray="4 2" />
        <line x1="25%" y1="52%" x2="42%" y2="60%" stroke="#b0121b" strokeWidth="1" strokeDasharray="2 4" />
      </svg>

      {/* =========================================================================
       * UPPER-LEFT FLANK: Haunted Mansion Evidence Board (Desktop)
       * ========================================================================= */}
      <div className="pointer-events-none absolute left-3 sm:left-5 md:left-6 lg:left-8 xl:left-10 top-0 sm:top-1 md:top-2 lg:top-3 z-10 hidden md:block w-[320px] md:w-[400px] lg:w-[470px] xl:w-[520px] animate-fade-in-board">
        <div className="relative">
          <img
            src={evidenceBoardImg}
            alt="Haunted Mansion Evidence Board with Forensic Notes, Polaroids and Strings"
            width={535}
            height={466}
            loading="eager"
            className="w-full h-auto object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
          />
        </div>
      </div>

      {/* =========================================================================
       * CENTER COLUMN: Faint Arcane Red Rune Watermark (Mobile) + Emblem + Title + Tagline + Ornate CTA
       * ========================================================================= */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-start px-3 sm:px-4 pt-1 sm:pt-2 md:pt-4 pb-6 sm:pb-10 text-center translate-y-0">
        
        {/* Mobile Arcane Red Rune Circle: Faint concentric rings with small red rune marks behind emblem & title */}
        <div
          className="pointer-events-none absolute top-[148px] sm:top-[165px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[345px] sm:w-[395px] h-[345px] sm:h-[395px] opacity-40 select-none z-0 block md:hidden"
          aria-hidden="true"
        >
          <img
            src={runeCircleSvg}
            alt=""
            width={600}
            height={600}
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(176,18,27,0.35)]"
          />
        </div>

        <div className="relative flex flex-col items-center justify-center w-full max-w-3xl">

          {/* Main Brand Logo: 85-90% of screen width on mobile, bright crisp red, no heavy dark shadow */}
          <div className="relative z-20 flex flex-col items-center justify-center w-[94%] max-w-[370px] sm:w-[92%] sm:max-w-[420px] md:w-full md:max-w-[440px] lg:max-w-[500px] xl:max-w-[530px] mb-0.5 sm:mb-1 md:mb-2">
            <img
              src={fullLogoWithTextImg}
              alt="MASOULEN '26"
              width={556}
              height={449}
              loading="eager"
              fetchPriority="high"
              className="w-full h-auto object-contain filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.22)] transition-transform duration-500 hover:scale-[1.02]"
            />
            {/* Screen-reader accessible heading */}
            <h1 className="sr-only">MASOULEN '26</h1>
          </div>

          {/* 3. Letter-spaced Tagline matching reference close-up */}
          <p className="relative z-10 font-serif text-[10px] sm:text-xs md:text-sm lg:text-[15px] font-semibold uppercase tracking-[0.28em] sm:tracking-[0.34em] text-[#120304] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] px-2 sm:px-4">
            THE CASE THAT NEVER HAPPENED
          </p>

          {/* 4. Top Ornate Gothic Divider with Filigree Cross Knot */}
          <div className="relative z-10 my-0.5 sm:my-1 md:my-2 flex items-center justify-center pointer-events-none select-none">
            <img
              src={dividerTopImg}
              alt=""
              aria-hidden="true"
              width={274}
              height={14}
              className="w-36 sm:w-48 md:w-64 lg:w-72 h-auto object-contain opacity-90 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
            />
          </div>

          {/* 5. Subtitle: Title Case, Classical Upright Serif (NOT italic) */}
          <p className="relative z-10 font-serif text-xs sm:text-sm md:text-xl lg:text-[22px] xl:text-2xl not-italic font-semibold text-[#120304] tracking-normal sm:tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]">
            A 48-Hour Murder Mystery Hackathon
          </p>

          {/* 6. Bottom Ornate Gothic Divider with Diamond Knot */}
          <div className="relative z-10 my-0.5 sm:my-1 md:my-2 flex items-center justify-center pointer-events-none select-none">
            <img
              src={dividerBottomImg}
              alt=""
              aria-hidden="true"
              width={214}
              height={12}
              className="w-28 sm:w-36 md:w-52 lg:w-60 h-auto object-contain opacity-85 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
            />
          </div>

          {/* 7. Gothic CTA Button using RegisterButtonFrame with Centered Real HTML/CSS Text */}
          <div className="relative z-30 mt-1 sm:mt-1.5 md:mt-3 animate-cta-pulse">
            <Link
              to={isClosed ? '/status' : '/register'}
              className="group relative inline-flex items-center justify-center w-[205px] sm:w-[240px] md:w-[290px] lg:w-[330px] transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e51a24] active:scale-95"
            >
              {/* Ornate Frame Image from RegisterButtonFrame.png */}
              <img
                src={registerBtnFrameImg}
                alt=""
                aria-hidden="true"
                width={2159}
                height={715}
                className="w-full h-auto object-contain select-none pointer-events-none filter drop-shadow-[0_0_10px_rgba(229,26,36,0.5)] group-hover:drop-shadow-[0_0_18px_rgba(229,26,36,0.85)] transition-all"
              />

              {/* Centered Real HTML/CSS Button Text */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 px-4 select-none pointer-events-none">
                <span className="text-[10px] sm:text-xs md:text-sm text-[#ff3b47] transition-transform duration-300 group-hover:rotate-45" aria-hidden="true">✦</span>
                <span className="font-serif text-[11px] sm:text-xs md:text-sm lg:text-base font-bold tracking-[0.22em] text-[#ffffff] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {isClosed ? 'CHECK STATUS' : 'REGISTER NOW'}
                </span>
                <span className="text-[10px] sm:text-xs md:text-sm text-[#ff3b47] transition-transform duration-300 group-hover:-rotate-45" aria-hidden="true">✦</span>
              </div>
            </Link>
          </div>

          {/* 8. Mobile Evidence Board: Edge-to-edge full width with CSS mask gradient fading smoothly */}
          <div
            className="relative mt-0.5 sm:mt-1 -mt-1 sm:-mt-1.5 w-[calc(100%+1.5rem)] sm:w-[calc(100%+2rem)] -mx-3 sm:-mx-4 block md:hidden z-10 animate-fade-in-board"
            style={{
              maskImage: 'radial-gradient(ellipse 96% 82% at 50% 50%, black 50%, transparent 98%)',
              WebkitMaskImage: 'radial-gradient(ellipse 96% 82% at 50% 50%, black 50%, transparent 98%)',
            }}
          >
            <img
              src={mobileEvidenceBoardImg}
              alt="Murder Mystery Evidence Board with Haunted Mansion, Polaroids and Crime Clues"
              width={682}
              height={293}
              loading="lazy"
              className="w-full h-auto object-cover object-center select-none pointer-events-none"
            />
          </div>

        </div>

      </div>

      {/* =========================================================================
       * FOREGROUND CHARACTERS:
       * Desktop: Raven on Bottom-Left, Detective on Bottom-Right
       * Mobile: Raven on Bottom-Left, Detective (waist up) on Bottom-Right
       * ========================================================================= */}
      
      {/* Bottom Left: Raven (Facing right / inward toward center) */}
      <div className="absolute bottom-0 left-0 z-30 pointer-events-none w-[125px] sm:w-[150px] md:w-[240px] lg:w-[320px] xl:w-[360px] animate-float-raven">
        <img
          src={ravenImg}
          alt="Gothic Raven with glowing crimson eye"
          width={615}
          height={406}
          loading="eager"
          className="w-full h-auto object-contain filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Mobile-only Bottom Right: Detective (waist up, magnifying glass and folder visible) */}
      <div className="absolute bottom-0 -right-2 sm:-right-3 z-30 pointer-events-none block md:hidden w-[130px] sm:w-[155px] animate-float-detective">
        <img
          src={detectiveMobileImg}
          alt="Detective with magnifying glass and confidential dossier"
          width={1010}
          height={1180}
          loading="eager"
          className="w-full h-auto object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Desktop-only Bottom Right: Detective Woman (Holding magnifying glass and dossier) */}
      <div className="absolute bottom-0 right-0 z-20 pointer-events-none hidden md:block w-[240px] lg:w-[320px] xl:w-[380px] animate-float-detective">
        <img
          src={detectiveImg}
          alt="Detective with magnifying glass and confidential dossier"
          width={400}
          height={535}
          loading="eager"
          className="w-full h-auto object-contain filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.85)]"
        />
      </div>
    </section>
  );
};

export default Hero;
