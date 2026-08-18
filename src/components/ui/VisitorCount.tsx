// src/components/ui/VisitorCounter.tsx
import { useState, useEffect } from 'react';

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      async function incrementAndFetchCount() {
        try {
          // 💡 1. Set your clean domain namespace (dots replaced by hyphens)
          const baseNamespace = "betterinfantaquezon-org";

          // 💡 2. Detect if running locally (Vite sets import.meta.env.DEV to true on npm run dev)
          // If local, it adds "-dev" to isolate your local testing hits from real users!
          const isDev = import.meta.env.DEV;
          const activeNamespace = isDev ? `${baseNamespace}-dev` : baseNamespace;

          const res = await fetch(`https://api.counterapi.dev/v1/${activeNamespace}/visits/up`);
          if (!res.ok) throw new Error("Counter fetch failed");
          const data = await res.json();

          setCount(data.count);
        } catch (err) {
          console.error("Failed to fetch visitor count", err);
        } finally {
          setLoading(false);
        }
      }

      incrementAndFetchCount();
    }, []);

  // Soft, layout-stable loading skeleton
  if (loading) {
    return <div className="h-4 w-16 bg-gray-200/40 rounded animate-pulse" />;
  }

  // Silent fallback if API is offline or blocked
  if (count === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 select-none shrink-0" aria-label={`Website visitor count: ${count}`}>

      {/* 🟢 Delicate Green Pulse Indicator (Signals active analytics tracking) */}
      <div className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </div>

      {/* Dynamic Styled Output */}
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[9px] font-axis-sng-indlab-header text-gray-500 uppercase tracking-widest">
          Visits
        </span>
        <span className="text-xs sm:text-sm font-axis-sng-indlab-value text-burgundy-950 font-bold tabular-nums">
          {count.toLocaleString()}
        </span>
      </div>

    </div>
  );
}
