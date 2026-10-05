// src/components/home/QuickActions.tsx
import { Link } from 'react-router-dom';
import LazyIcon from '@/components/ui/Lazying';
import Section from '../ui/Section';

interface ActionItem {
  label: string;
  href: string;
  icon: string;
  category: string;
}

// 💡 High-frequency municipal services for Infanta
const COMMON_ACTIONS: ActionItem[] = [
  {
    label: "Apply for a Business Permit",
    href: "/services/business/business-permit-and-license",
    icon: "ri:briefcase-line",
    category: "Business",
  },
  {
    label: "Register a Fishing Boat",
    href: "/services/agriculture-fisheries/boat-registration",
    icon: "ri:ship-line",
    category: "Fisheries",
  },
  {
    label: "Apply for a PWD ID",
    href: "/services/social-welfare/pwd-id",
    icon: "mingcute:disabled-fill",
    category: "Document",
  },
  {
    label: "Secure a Cedula (CTC)",
    href: "/services/business/community-tax-certificate",
    icon: "ri:coins-line",
    category: "Treasury",
  },
  {
    label: "Get Birth Certificate (COLB)",
    href: "/services/social-welfare/birth-registration",
    icon: "tabler:baby-carriage-filled",
    category: "Document"
  },
  {
    label: "Check Emergency Hotlines",
    href: "/safety",
    icon: "ri:phone-line",
    category: "Safety",
  },
  {
    label: "Know the Local Government",
    href: "/government/lgu",
    icon: "ri:government-line",
    category: "Legislative",
  },
];

export default function QuickActions() {
  return (
    <Section>
    <div className="w-full mx-auto mt-6 pt-4 text-start">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-lg sm:text-2xl font-axis-wide-header uppercase tracking-wider text-fantas-800">
          I want to...
        </span>
        <div className="h-px flex-1 bg-fantas-800/20" aria-hidden="true" />
      </div>

      {/* 🚀 Quick Action Chips Grid */}
      <div className="grid grid-cols-3 xs:grid-cols-2 items-center gap-2 sm:gap-2.5">
        {COMMON_ACTIONS.map((action, i) => (
          <Link
            key={i}
            to={action.href}
            className="group inline-flex justify-between uppercase items-center gap-2 px-3 py-2 bg-white border border-gray-200/90 hover:border-fantas-700 hover:bg-fantas-50/40 text-fantas-950 transition-all duration-200 text-xs sm:text-sm font-axis-navbar-focus select-none"
          >
            <div className='group inline-flex items-center gap-2'>
              <LazyIcon
              name={action.icon}
              className="h-4 w-4 text-fantas-700 group-hover:text-fantas-900 transition-colors shrink-0"
              />
              <span className="tracking-wider">{action.label}</span>
            </div>
            <LazyIcon
              name="ri:arrow-right-s-line"
              className="h-3.5 w-3.5 text-gray-400 group-hover:text-fantas-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5"
            />
          </Link>
        ))}
      </div>
      </div>
    </Section>
  );
}
