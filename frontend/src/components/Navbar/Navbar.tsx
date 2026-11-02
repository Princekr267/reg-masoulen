import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import emblemImg from '../../assets/masoulen/emblem.webp';
import navContainerImg from '../../assets/masoulen/nav-container-clean.webp';
import swordImg from '../../assets/masoulen/gothic-crimson-sword.webp';

interface NavItem {
  label: string;
  href: string;
  isExternalOrRoute?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Details', href: '#details' },
  { label: 'Register', href: '/register', isExternalOrRoute: true },
  { label: 'FAQ', href: '#faq' },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');
  const location = useLocation();
  const navigate = useNavigate();

  // IntersectionObserver Scroll-Spy: automatically highlights the section currently in view
  useEffect(() => {
    if (location.pathname !== '/') {
      if (location.pathname === '/register') setActiveItem('Register');
      return;
    }

    const sections = ['home', 'about', 'details', 'faq'];
    const elements = sections
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const matched = NAV_ITEMS.find((item) => item.href === `#${id}`);
            if (matched) {
              setActiveItem(matched.label);
            }
          }
        });
      },
      {
        rootMargin: '-20% 0px -50% 0px',
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.pathname]);

  // Handle URL hash on initial page load / route transition
  useEffect(() => {
    if (location.hash && location.pathname === '/') {
      const targetId = location.hash.substring(1);
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset - 75;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item.label);
    setIsOpen(false);

    if (item.isExternalOrRoute) {
      navigate(item.href);
      return;
    }

    if (item.href.startsWith('#')) {
      const targetId = item.href.substring(1);
      if (location.pathname !== '/') {
        // If on another route (/register, /rules), go back to landing page with hash
        navigate(`/${item.href}`);
        return;
      }

      if (targetId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const top = targetEl.getBoundingClientRect().top + window.pageYOffset - 75;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent px-2.5 sm:px-3.5 md:px-6 pt-1.5 sm:pt-2 md:pt-0 pb-1 sm:pb-1 md:pb-0 md:-mt-2 transition-all duration-300">
      {/* Centered Ornate Gothic Navbar Container with Responsive Height & Balanced Inward Padding */}
      <div className="relative mx-auto w-full max-w-[1360px] h-11 sm:h-13 md:h-16 lg:h-18 flex items-center justify-between px-4 sm:px-6 md:px-8 min-[1024px]:px-10 lg:px-14 xl:px-20 select-none">
        
        {/* Ornate Nav Container Background Frame */}
        <img
          src={navContainerImg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full object-fill drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
        />

        {/* Brand Logo Lockup: Crest Emblem + Title inside container */}
        <Link
          to="/"
          onClick={() => {
            setActiveItem('Home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group relative z-10 flex items-center gap-2 sm:gap-2.5 md:gap-3 focus:outline-none shrink-0"
        >
          <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center">
            {/* Subtle crimson emblem glow */}
            <div className="absolute inset-0 rounded-full bg-[#e51a24]/20 blur-sm group-hover:bg-[#e51a24]/40 transition-colors" />
            <img
              src={emblemImg}
              alt="Masoulen Crest"
              width={38}
              height={38}
              className="relative h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 object-contain drop-shadow-[0_0_6px_rgba(229,26,36,0.6)]"
            />
          </div>

          <span className="font-gothic text-[11px] sm:text-xs md:text-base lg:text-lg font-bold tracking-[0.2em] sm:tracking-[0.22em] text-[#f5e6d3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-white transition-colors">
            MASOULEN '26
          </span>
        </Link>

        {/* Mobile Center Glowing Red Diamond Marker (hidden at >=900px desktop view) */}
        <div className="relative z-10 block min-[900px]:hidden">
          <span className="text-[#e51a24] text-[11px] select-none animate-pulse drop-shadow-[0_0_6px_#e51a24]">✦</span>
        </div>

        {/* Desktop Navigation Links with Flanking Gothic Crimson Swords (≥900px) */}
        <nav className="relative z-10 hidden min-[900px]:flex items-center gap-2 lg:gap-3 xl:gap-4 shrink-0">
          {/* Left Gothic Crimson Sword Divider: tip points left toward MASOULEN '26, crossguard faces Home */}
          <img
            src={swordImg}
            alt=""
            aria-hidden="true"
            width={823}
            height={303}
            className="w-[110px] min-[1024px]:w-[135px] min-[1280px]:w-[160px] h-auto max-h-11 lg:max-h-13 object-contain pointer-events-none select-none filter drop-shadow-[0_0_6px_rgba(229,26,36,0.35)] shrink-0"
            style={{
              maskImage: 'linear-gradient(to right, black 75%, transparent 96%)',
              WebkitMaskImage: 'linear-gradient(to right, black 75%, transparent 96%)',
            }}
          />

          {/* Centered Navigation Links */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3.5 xl:gap-4.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeItem === item.label;

              const content = (
                <span
                  className={`relative px-1.5 sm:px-2 py-1 font-serif text-xs min-[1024px]:text-sm min-[1280px]:text-base tracking-widest uppercase transition-all duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? 'text-[#ff3b47] font-bold text-glow-red'
                      : 'text-[#d8c5b2] hover:text-white hover:text-glow-red-sm'
                  }`}
                >
                  {item.label}
                </span>
              );

              return item.isExternalOrRoute ? (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => handleNavClick(item)}
                  className="focus:outline-none focus-visible:ring-1 focus-visible:ring-[#e51a24]"
                >
                  {content}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item);
                  }}
                  className="focus:outline-none focus-visible:ring-1 focus-visible:ring-[#e51a24]"
                >
                  {content}
                </a>
              );
            })}
          </div>

          {/* Right Gothic Crimson Sword Divider: mirrored with scaleX(-1), tip points right (outward), crossguard faces FAQ */}
          <img
            src={swordImg}
            alt=""
            aria-hidden="true"
            width={823}
            height={303}
            className="w-[110px] min-[1024px]:w-[135px] min-[1280px]:w-[160px] h-auto max-h-11 lg:max-h-13 object-contain pointer-events-none select-none scale-x-[-1] filter drop-shadow-[0_0_6px_rgba(229,26,36,0.35)] shrink-0"
            style={{
              maskImage: 'linear-gradient(to right, black 75%, transparent 96%)',
              WebkitMaskImage: 'linear-gradient(to right, black 75%, transparent 96%)',
            }}
          />
        </nav>

        {/* Mobile Hamburger Button inside container (<900px) */}
        <div className="relative z-10 flex min-[900px]:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-gothic-menu"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-1.5 text-[#e8d5c4] hover:text-[#ff3b47] focus:outline-none"
          >
            <div className="flex h-5 w-5 flex-col items-center justify-center space-y-1">
              <span
                className={`block h-0.5 w-5 bg-current transform transition duration-300 ease-in-out ${
                  isOpen ? 'rotate-45 translate-y-1.5 bg-[#ff3b47]' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-3.5 bg-current transition duration-200 ease-in-out ${
                  isOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transform transition duration-300 ease-in-out ${
                  isOpen ? '-rotate-45 -translate-y-1.5 bg-[#ff3b47]' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Gothic Drawer (<900px) */}
      <div
        id="mobile-gothic-menu"
        className={`min-[900px]:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
        } mx-auto max-w-sm rounded bg-[#0e0204]/95 border border-[#b0121b] shadow-2xl backdrop-blur-xl`}
      >
        <div className="px-4 py-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.label;
            const content = (
              <div
                className={`flex items-center justify-between px-3.5 py-2.5 rounded border font-serif text-base tracking-widest uppercase transition-colors ${
                  isActive
                    ? 'border-[#b0121b] bg-[#3a0608]/50 text-[#ff3b47] text-glow-red font-semibold'
                    : 'border-transparent text-[#e8d5c4] hover:border-[#b0121b]/40 hover:bg-[#220305]/60 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs text-[#b0121b]">❖</span>
              </div>
            );

            return item.isExternalOrRoute ? (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => handleNavClick(item)}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item);
                }}
                className="block"
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
