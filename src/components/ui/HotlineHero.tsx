// src/components/safety/HotlineHero.tsx
import LazyIcon from '@/components/ui/Lazying';
import Section from './Section';

interface HotlineItem {
  agency: string;
  number: string;
  callNumber: string;
  icon: string;
}

const LOCAL_EMERGENCY_QUADRANTS: HotlineItem[] = [
  {
    agency: "Infanta MDRRMO",
    number: "0918 395 3839",
    callNumber: "09183953839",
    icon: "mingcute:vest-fill",
  },
  {
    agency: "Infanta BFP Fire Station",
    number: "(042) 535 2700",
    callNumber: "0425352700",
    icon: "roentgen:fire-hydrant",
  },
  {
    agency: "Infanta PNP Police",
    number: "0998 598 5754",
    callNumber: "09985985754",
    icon: "game-icons:police-badge",
  },
  {
    agency: "Rural Health Unit (RHU)",
    number: "(042) 535 2151",
    callNumber: "0425352151",
    icon: "ic:round-health-and-safety",
  },
];

export default function HotlineHero() {
  return (
    <Section className="bg-flamengo-50">
      <div className="w-full mx-auto py-4 select-none text-start">

        {/* 🏷️ Hero Masthead Header */}
        <div className="mb-6 text-center sm:text-start">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-axis-wide-header text-center uppercase text-flamengo-700 tracking-wide leading-tight">
            Who to call
          </h1>
          <p className="text-xs sm:text-sm text-center uppercase tracking-wider text-flamengo-700/60 font-axis-wide-subheader mt-1.5">
            Save the following contacts in case of emergencies, rescue helps, and public safety concerns.
          </p>
        </div>

        {/* 🚨 THE EMERGENCY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

          {/* 🏛️ ROW 1 (TOP FULL-WIDTH ROW): National Emergency Hotline 911 */}
          <a
            href="tel:911"
            className="col-span-1 sm:col-span-2 group relative overflow-hidden bg-neutral-950 hover:bg-black text-white p-5 sm:p-6 border border-neutral-800 transition-all duration-300 flex flex-row sm:items-center justify-center gap-12 cursor-pointer"
            title="Tap to call 911 National Emergency Helpline"
          >
            {/* Subtle background ambient alert glow */}
            <div
              className="absolute -right-12 -top-12 size-48 bg-red-600/15 blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="flex items-start sm:items-center z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-axis-navbar-focus uppercase tracking-wider text-flamengo-50 leading-tight mt-0.5">
                  National Emergency Hotline
                </h2>
              </div>
            </div>

            {/* 911 Dial Number Block */}
            <div className="flex items-center justify-around sm:justify-end gap-6 z-10">
              <span className="text-5xl sm:text-6xl font-axis-sng-indlab-value text-flamengo-50 tracking-wider">
                911
              </span>

              <div className="relative flex items-center justify-center size-12 bg-flamengo-600 text-white shrink-0">
                <LazyIcon name="ri:phone-fill" className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </a>

          {/* 🚨 ROW 2 & 3: Uniform Red Local Emergency Grid */}
          {LOCAL_EMERGENCY_QUADRANTS.map((item, idx) => (
            <a
              key={idx}
              href={`tel:${item.callNumber}`}
              className="group relative overflow-hidden text-white py-5 sm:py-6 border bg-flamengo-700 hover:bg-flamengo-800 border-flamengo-800/40 transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              title={`Tap to call ${item.agency}`}
            >
              {/* Top row: Icon + Agency Titles */}
              <div className="flex flex-col items-center justify-between gap-3">
                <div className="size-10 sm:size-11 bg-white/15 flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition-transform">
                  <LazyIcon name={item.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-md sm:text-lg font-axis-navbar-focus uppercase tracking-wider text-white leading-tight">
                    {item.agency}
                  </h3>
                </div>
              </div>

              {/* Bottom row: Direct Phone Number + Call Trigger */}
              <div className="flex items-baseline justify-center gap-4">
                <div className="flex flex-row">
                  <span className="text-xl sm:text-3xl font-axis-sng-indlab-value text-amber-200 tracking-wider">
                    {item.number}
                  </span>
                </div>

                {/* Interactive Phone Call Icon Badge */}
                <div className="size-8 bg-white/15 group-hover:bg-white group-hover:text-neutral-900 text-white flex items-center justify-center transition-all shrink-0">
                  <LazyIcon name="ri:phone-fill" className="h-4 w-4" />
                </div>
              </div>
            </a>
          ))}

        </div>

        {/* ⚠️ Municipal Advisory Note */}
        <div className="mt-4 text-center sm:text-start">
          <p className="text-xs font-axis-navbar-focus tracking-wide text-flamengo-800/70">
            Toll-free when calling 911 from landlines and major mobile networks. Standard local telecom charges may apply for direct mobile numbers.
          </p>
          <p className="text-xs font-axis-navbar-focus tracking-wide text-flamengo-800/70">
            Phone numbers are sourced from respective social media pages of present authorities; rural health unit phone number from provincial health directory lists.
          </p>
        </div>

      </div>
    </Section>
  );
}
