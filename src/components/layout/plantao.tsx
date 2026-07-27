// app/components/plantao.tsx
import { useState, useEffect } from 'react';
import {
  Phone,
  Shield,
  Flame,
  Activity,
  Landmark,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

// --- PRIVATE HELPERS & CONFIGS (No export keyword to satisfy Fast Refresh) ---

interface HotlineItem {
  agency: string;
  number: string;
  icon: LucideIcon;
  iconClass: string;
}

const INFANTA_HOTLINES: HotlineItem[] = [
  {
    agency: 'Infanta MDRRMO (Disaster)',
    number: '0918-395-3839',
    icon: ShieldAlert,
    iconClass: 'text-red-400 fill-red-950/40',
  },
  {
    agency: 'Infanta PNP (Police)',
    number: '0915-789-3115',
    icon: Shield,
    iconClass: 'text-blue-400 fill-blue-950/40',
  },
  {
    agency: 'Infanta BFP (Fire Dept)',
    number: '(042) 797-2320',
    icon: Flame,
    iconClass: 'text-amber-500 fill-amber-950/40',
  },
  {
    agency: 'Rural Health Unit (RHU)',
    number: '(042) 535-9331',
    icon: Activity,
    iconClass: 'text-emerald-400 fill-emerald-950/40',
  },
  {
    agency: "Municipal Mayor's Office",
    number: '(042) 535-4045',
    icon: Landmark,
    iconClass: 'text-amber-400 fill-amber-950/40',
  },
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

  return (
    <div className="w-full bg-red-950 border-b border-red-900/40 text-[10px] font-axis-book uppercase tracking-wider text-red-200/80 py-1.5 px-6 select-none transition-all duration-300 relative">
      <div className="max-w-4/5 mx-auto flex items-center justify-between gap-4 w-full">
        {/* 🚨 Emergency Label Identifier */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </div>
          <span className="font-axis-bold text-red-100 text-[10px] tracking-widest">
            HOTLINES
          </span>
        </div>

        {/* 🎠 Hidden Overflow Window Slider */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {INFANTA_HOTLINES.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex-none px-2 flex items-center justify-center"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <a
                    href={`tel:${item.number}`}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2.5 py-1 w-full transition-colors duration-200 justify-between group"
                    title={`Click to call ${item.agency}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ItemIcon
                        className={`h-3.5 w-3.5 shrink-0 ${item.iconClass}`}
                      />
                      <span className="truncate text-[10px] text-red-200 group-hover:text-white transition-colors">
                        {item.agency}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <Phone className="h-2.5 w-2.5 text-red-400/80 group-hover:text-red-400 transition-colors" />
                      <span className="font-axis-chunky text-amber-300 tracking-tight text-[10px] tabular-nums">
                        {item.number}
                      </span>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🕹️ Tiny Manual Chevron Controllers */}
        <div className="flex items-center gap-2.5 shrink-0 border-l border-red-900/60 pl-3">
          {/* Chevron Navigation */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrev}
              className="p-0.5 hover:bg-white/10 rounded text-red-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Previous Emergency Agency"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-0.5 hover:bg-white/10 rounded text-red-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Next Emergency Agency"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Navigation Link to safety/hotline directory page */}
          <a
            href="/safety" // Replace with your target route (e.g., '/safety' or '/services')
            className="flex items-center gap-1 shrink-0 rounded bg-white/5 hover:bg-white/10 px-2.5 py-0.5 text-[10px] font-axis-bold tracking-wider text-red-100 hover:text-white transition-all duration-200 cursor-pointer"
          >
            More here
          </a>
        </div>
      </div>
    </div>
  );
}
