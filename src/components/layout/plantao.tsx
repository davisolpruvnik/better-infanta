// app/components/plantao.tsx
import { useState, useEffect, lazy, Suspense } from 'react';
import { resolveIconName } from '@/lib/icon-resolver';

// 💡 LAZY ENABLED: Split the Iconify renderer into a separate on-demand chunk
const LazyIconify = lazy(() =>
  import('@iconify/react').then(m => ({ default: m.Icon }))
);

// --- PRIVATE HELPERS & CONFIGS ---

interface HotlineItem {
  agency: string;
  number: string;
  icon: string;
  iconClass: string;
}

const INFANTA_HOTLINES: HotlineItem[] = [
  {
    agency: 'Infanta MDRRMO',
    number: '0918 395 3839',
    icon: 'mingcute:vest-fill',
    iconClass: 'text-fantas-100 fill-fantas-100/40',
  },
  {
    agency: 'Infanta PNP',
    number: '0998 598 5754',
    icon: 'game-icons:police-badge',
    iconClass: 'text-fantas-100 fill-fantas-100/40',
  },
  {
    agency: 'Infanta BFP',
    number: '(042) 535 2700',
    icon: 'roentgen:fire-hydrant',
    iconClass: 'text-fantas-100 fill-fantas-100/40',
  },
  {
    agency: 'Task Force Disiplina',
    number: '(042) 535 9928',
    icon: 'game-icons:police-badge',
    iconClass: 'text-fantas-100 fill-fantas-100/40',
  },
  {
    agency: "Mayor's Office",
    number: '(042) 535 4045',
    icon: 'roentgen:government',
    iconClass: 'text-fantas-100 fill-fantas-100/40',
  },
  {
    agency: "National Emergency Hotline",
    number: '911',
    icon: 'ic:sharp-emergency',
    iconClass: 'text-fantas-100 fill-fantas-100/40',

  }
];

// --- COMPONENT ---

export default function Plantao() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // 1. Calculate items visible in viewport based on screen size
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
    <div className="w-full animate-emergency border-b text-[10px] font-axis-book uppercase tracking-wider text-red-100 py-2 sm:py-1.5 px-3 sm:px-6 select-none transition-all duration-300 relative overflow-hidden">
      {/* 🚨 Ambient background emergency pulse glow */}
      <div
        className="absolute inset-0 bg-red-800/15 animate-pulse animation-duration-[1.5s] pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Wrapper */}
      <div className="relative z-10 px-2 w-full max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        {/* TOP PANEL */}
        <div className="flex items-center justify-between shrink-0 sm:justify-start">
          {/* 🚨 Emergency Label Identifier */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping animation-duration-[0.4s] absolute inline-flex h-full w-full rounded-full bg-fantas-50 opacity-100"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-fantas-50"></span>
            </div>
            <span className="font-axis-navbar-focus text-fantas-100 text-[16px] tracking-widest">
              HOTLINES
            </span>
          </div>

          {/* 🕹️ Mobile-Only Compact Controllers */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrev}
                className="h-6 w-6 flex items-center justify-center hover:bg-white/10 rounded-full text-fantas-50 hover:text-white transition-colors cursor-pointer"
                aria-label="Previous Emergency Agency"
              >
                {getIcon('tabler:chevron-left', 'h-3.5 w-3.5')}
              </button>
              <button
                onClick={handleNext}
                className="h-6 w-6 flex items-center justify-center hover:bg-white/10 rounded-full text-fantas-50 hover:text-white transition-colors cursor-pointer"
                aria-label="Next Emergency Agency"
              >
                {getIcon('tabler:chevron-right', 'h-3.5 w-3.5')}
              </button>
            </div>
            <a
              href="/safety"
              className="bg-white/5 hover:bg-white/10 px-2 py-1 text-[12px] font-axis-sng-indlab-value tracking-wider text-fantas-100 hover:text-white transition-all duration-200 cursor-pointer rounded-sm"
            >
              More
            </a>
          </div>
        </div>

        {/* 🎠 Hidden Overflow Window Slider */}
        <div className="relative flex-1 overflow-hidden w-full">
          {/* Added -mx-1 sm:-mx-1.5 to offset item padding */}
          <div
            className="flex transition-transform duration-800 ease-in-out -mx-1 sm:-mx-1.5"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {INFANTA_HOTLINES.map((item, idx) => {
              return (
                /* Added px-1 sm:px-1.5 to create gaps between hotline cards */
                <div
                  key={idx}
                  className="flex-none flex items-center justify-center px-1 sm:px-1.5"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <a
                    href={`tel:${item.number}`}
                    className="flex items-center gap-1.5 sm:gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2.5 py-1.5 sm:py-1 w-full transition-colors duration-200 justify-between group"
                    title={`Click to call ${item.agency}`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                      {getIcon(
                        item.icon,
                        `h-5 w-5 shrink-0 text-fantas-100 ${item.iconClass}`
                      )}
                      <span className="font-axis-subtitular-focus tracking-wider truncate text-[12px] text-fantas-100 group-hover:text-white transition-colors max-w-[130px] min-[370px]:max-w-none">
                        {item.agency}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {getIcon(
                        'Phone',
                        'h-2.5 w-2.5 text-fantas-100 transition-colors'
                      )}
                      <span className="font-axis-sng-indlab-value text-fantas-100 tracking-wide text-[18px] proportional-nums">
                        {item.number}
                      </span>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🕹️ Desktop-Only Manual Chevron Controllers */}
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
            className="flex items-center gap-1 shrink-0 rounded font-axis-sng-indlab-value bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[12px] font-axis-bold tracking-wider text-red-100 hover:text-white transition-all duration-200 cursor-pointer"
          >
            More
          </a>
        </div>
      </div>
    </div>
  );
}
