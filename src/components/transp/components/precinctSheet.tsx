// src/components/transparency/PrecinctSheet.tsx
import { useRef, type ReactNode } from 'react';

interface PrecinctSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function PrecinctSheet({ isOpen, onClose, children }: PrecinctSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Swipe-down gesture: dismisses when dragged down >50px from top of scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const isAtTop = (contentRef.current?.scrollTop ?? 0) <= 0;

    if (deltaY > 50 && isAtTop) {
      onClose();
    }
    touchStartY.current = null;
  };

  return (
    /*
      Floating Inspector Card:
      - No dark backdrop: Map remains primary, bright, and interactive
      - Floating margins from edges (left, right, bottom + safe-area)
      - Rounded pill grab handle for easy swipe-down dismiss
    */
    <aside
      role="region"
      aria-label="Precinct details"
      aria-hidden={!isOpen}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`lg:hidden fixed z-40 inset-x-6 bottom-[calc(0.1rem+env(safe-area-inset-bottom,0px))] sm:inset-x-6 sm:bottom-6 max-w-lg mx-auto h-[48dvh] max-h-[48dvh] bg-[#fbf9f6] border border-slate-300/90 rounded-lg shadow-lg flex flex-col transition-all duration-200 ease-out ${
        isOpen
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-[calc(100%+1rem)] opacity-0 pointer-events-none'
      }`}
    >

      {/* Internal scrolling container */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 sm:px-5 sm:pb-5 pt-6 text-start"
      >
        {children}
      </div>
    </aside>
  );
}
