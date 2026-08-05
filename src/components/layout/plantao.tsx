// app/components/plantao.tsx
import { useState, useEffect, lazy, Suspense } from 'react';
import { resolveIconName } from '@/lib/icon-resolver';

// 💡 LAZY ENABLED: Split the Iconify renderer into a separate on-demand chunk
const LazyIconify = lazy(() =>
  import('@iconify/react').then(m => ({ default: m.Icon }))
);

// --- PRIVATE HELPERS & CONFIGS (No export keyword to satisfy Fast Refresh) ---

interface HotlineItem {
  agency: string;
  number: string;
  icon: string;
  iconClass: string;
}

const INFANTA_HOTLINES: HotlineItem[] = [
  {
    agency: 'Infanta MDRRMO',
    number: '0918-395-3839',
    icon: 'mingcute:vest-fill',
    iconClass: 'text-red-400 fill-red-950/40',
  },
  {
    agency: 'Infanta PNP',
    number: '0915-789-3115',
    icon: 'game-icons:police-badge',
    iconClass: 'text-blue-400 fill-blue-950/40',
  },
  {
    agency: 'Infanta BFP',
    number: '(042) 797-2320',
    icon: 'roentgen:fire-hydrant',
    iconClass: 'text-amber-500 fill-amber-950/40',
  },
  {
    agency: 'Infanta RHU',
    number: '(042) 535-9331',
    icon: 'ic:round-health-and-safety',
    iconClass: 'text-emerald-400 fill-emerald-950/40',
  },
  {
    agency: "Mayor's Office",
    number: '(042) 535-4045',
    icon: 'roentgen:government',
    iconClass: 'text-amber-400 fill-amber-950/40',
  },
];

// --- COMPONENT ---

export default function Plantao() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // 1. Calculate items visible in viewport based on screen size (Dynamic Device Adaptability)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1); // Mobile
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2); // Tablet
      } else {
        setItemsPerView(3); // Desktop
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, INFANTA_HOTLINES.length - itemsPerView);

  // 2. Automate sidewards sliding scroll cycle every 4.5 seconds
  useEffect(() => {
    if (maxIndex === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);

    return () => clearInterval(interval);
  }, [maxIndex]);

  // Handle manual navigation clicks
  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  // 💡 3. Dynamic Lazy Icon Helper
  const getIcon = (categoryName: string, className = 'h-3.5 w-3.5') => {
    return (
      <Suspense
        fallback={
          <div
            className={`${className} rounded bg-white/10 animate-pulse shrink-0`}
          />
        }
      >
        <LazyIconify
          icon={resolveIconName(categoryName)}
          className={`${className} shrink-0`}
        />
      </Suspense>
    );
  };

  return (
    <div className="w-full bg-red-950 border-b border-red-900/40 text-[10px] font-axis-book uppercase tracking-wider text-red-200/80 py-2 sm:py-1.5 px-3 sm:px-6 select-none transition-all duration-300 relative overflow-hidden">
      {/* 🚨 Ambient background emergency pulse glow (Gently pulses every 1.5 seconds) */}
      <div
        className="absolute inset-0 bg-red-800/15 animate-pulse animation-duration-[1.5s] pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Wrapper (Switches to column layout on mobile to prevent dense cramping) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-2">
        {/* TOP PANEL (On mobile: Splits layout horizontally. On desktop: Flexes inline) */}
        <div className="flex items-center justify-between shrink-0 sm:justify-start">
          {/* 🚨 Emergency Label Identifier */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping animation-duration-[0.6s] absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-90"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <span className="font-axis-navbar-focus text-amber-300 text-[16px] tracking-widest">
              HOTLINES
            </span>
          </div>

          {/* 🕹️ Mobile-Only Compact Controllers (Inline with Emergency label) */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrev}
                className="h-6 w-6 flex items-center justify-center hover:bg-white/10 rounded-full text-red-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Previous Emergency Agency"
              >
                {getIcon('tabler:chevron-left', 'h-3.5 w-3.5')}
              </button>
              <button
                onClick={handleNext}
                className="h-6 w-6 flex items-center justify-center hover:bg-white/10 rounded-full text-red-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Next Emergency Agency"
              >
                {getIcon('tabler:chevron-right', 'h-3.5 w-3.5')}
              </button>
            </div>
            <a
              href="/safety"
              className="rounded bg-white/5 hover:bg-white/10 px-2 py-1 text-[9px] font-axis-bold tracking-wider text-red-100 hover:text-white transition-all duration-200 cursor-pointer"
            >
              More
            </a>
          </div>
        </div>

        {/* 🎠 Hidden Overflow Window Slider (Expands to take full width of row on mobile) */}
        <div className="relative flex-1 overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {INFANTA_HOTLINES.map((item, idx) => {
              return (
                <div
                  key={idx}
                  className="flex-none px-1.5 sm:px-2 flex items-center justify-center"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <a
                    href={`tel:${item.number}`}
                    className="flex items-center gap-1.5 sm:gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2.5 py-2 sm:py-1 w-full transition-colors duration-200 justify-between group"
                    title={`Click to call ${item.agency}`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                      {getIcon(
                        item.icon,
                        `h-3.5 w-3.5 shrink-0 ${item.iconClass}`
                      )}
                      <span className="font-axis-subtitular-focus tracking-wider truncate text-[12px] text-red-200 group-hover:text-white transition-colors max-w-[130px] min-[370px]:max-w-none">
                        {item.agency}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {getIcon(
                        'Phone',
                        'h-2.5 w-2.5 text-red-400/80 group-hover:text-red-400 transition-colors'
                      )}
                      <span className="font-axis-sng-indlab-value text-amber-300 tracking-wide text-[18px] proportional-nums">
                        {item.number}
                      </span>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🕹️ Desktop-Only Manual Chevron Controllers & safety links */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-3 shrink-0 border-l border-red-900/60 pl-2 sm:pl-3">
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrev}
              className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-full text-red-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Previous Emergency Agency"
            >
              {getIcon('tabler:chevron-left', 'h-3.5 w-3.5')}
            </button>
            <button
              onClick={handleNext}
              className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-full text-red-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Next Emergency Agency"
            >
              {getIcon('tabler:chevron-right', 'h-3.5 w-3.5')}
            </button>
          </div>
          <a
            href="/safety"
            className="flex items-center gap-1 shrink-0 rounded bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-axis-bold tracking-wider text-red-100 hover:text-white transition-all duration-200 cursor-pointer"
          >
            More
          </a>
        </div>
      </div>
    </div>
  );
}
