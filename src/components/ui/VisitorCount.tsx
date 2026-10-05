// src/components/ui/VisitorCounter.tsx
import { useState, useEffect } from 'react';

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      async function handleVisitorCount() {
        const baseNamespace = "betterinfantaquezon-org";
        const isDev = import.meta.env.DEV;
        const activeNamespace = isDev ? `${baseNamespace}-dev` : baseNamespace;

        // 💡 Check if visitor was already counted in the last 24 hours
        const VISIT_TIMESTAMP_KEY = `${baseNamespace}_last_visit_ts`;
        const lastVisit = localStorage.getItem(VISIT_TIMESTAMP_KEY);
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        const isUniqueVisit = !lastVisit || now - parseInt(lastVisit, 10) > TWENTY_FOUR_HOURS;

        // 💡 Only increment (/up) if unique; otherwise just read (/visits)
        const endpoint = isUniqueVisit
          ? `https://api.counterapi.dev/v1/${activeNamespace}/visits/up`
          : `https://api.counterapi.dev/v1/${activeNamespace}/visits`;

        try {
          const res = await fetch(endpoint);
          if (!res.ok) throw new Error("Counter fetch failed");
          const data = await res.json();

          setCount(data.count);

          // Lock in the timestamp once counted
          if (isUniqueVisit) {
            localStorage.setItem(VISIT_TIMESTAMP_KEY, now.toString());
          }
        } catch (err) {
          console.warn("CounterAPI blocked or offline. Using local fallback.");

          const fallbackCountKey = `${baseNamespace}_fallback_count`;
          const currentLocal = localStorage.getItem(fallbackCountKey);
          let nextLocal = currentLocal ? parseInt(currentLocal, 10) : 1420;

          if (isUniqueVisit) {
            nextLocal += 1;
            localStorage.setItem(fallbackCountKey, nextLocal.toString());
            localStorage.setItem(VISIT_TIMESTAMP_KEY, now.toString());
          }

          setCount(nextLocal);
        } finally {
          setLoading(false);
        }
      }

      handleVisitorCount();
    }, []);

  if (loading) {
    return <div className="h-4 w-16 bg-white/10 rounded animate-pulse shrink-0" />;
  }

  if (count === null) return null;

  return (
    <div className="flex items-center gap-1.5 select-none shrink-0" aria-label={`Website visitor count: ${count}`}>
      {/* 🟢 Pulsing Green Indicator */}
      <div className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fantas-200 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-fantas-300" />
      </div>

      {/* 💡 Light text colors for dark footer contrast */}
      <div className="flex items-center gap-1.5 leading-none">
        <span className="text-[10px] font-axis-sng-indlab-header text-fantas-50 uppercase tracking-wider">
          Visits
        </span>
        <span className="text-xs sm:text-sm font-axis-sng-indlab-value text-fantas-50 tracking-wider">
          {count.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
