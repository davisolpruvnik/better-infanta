// src/pages/Municipio.tsx
import { useMemo } from 'react';
import yaml from 'js-yaml';
import SEO from '@/components/SEO';
import Breadcrumbsless from '@/components/ui/BreadcrumbsLess';

// Static raw import of your Municipio content index
import municipioYamlContent from '../../../content/government/lgu/municipio/index.yaml?raw';
import Section from '@/components/ui/Section';

// 💡 FIXED: Uses `@/components/ui/Lazying` to match your local file name

interface Councilor {
  name: string;
  slug: string;
  term: string;
  year_elected: number;
  year_debut?: number;
  reelected: boolean;
  sector?: string;
}

interface CouncilData {
  council: {
    mayor: Councilor;
    vice_mayor: Councilor;
    councilors: Councilor[];
  };
}

const getSurname = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
};

export default function Municipio() {
  const data = useMemo(() => {
    return yaml.load(municipioYamlContent) as CouncilData;
  }, []);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Municipio', href: undefined },
  ];

  return (
    <>
      <SEO
        title="Municipal Council & Executives"
        description="Meet the local government executives and Sangguniang Bayan legislative council members of Infanta, Quezon."
        keywords="municipal mayor, vice mayor, sangguniang bayan, local councilors, barangay abc, sk federation"
      />
      <Section className="p-3 mb-12">
        {/* Centered Breadcrumbs */}
        <div className="flex justify-center mb-8">
          <Breadcrumbsless items={breadcrumbs} className="text-xs" />
        </div>

        {/* Section Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-axis-titular-focus uppercase text-gray-900 mt-4 tracking-wide leading-snug">
            Executive & Legislative Branch
          </h1>
          <p className="text-sm font-axis-subtitular-focus text-gray-500 tracking-wide uppercase mt-1">
            Municipality of Infanta, Quezon
          </p>
        </div>

        {data?.council && (
          <div className="space-y-16">
            {/* 👑 SPACE 1: Executive Cards (💡 FIXED: Changed from Link to hoverable, non-clickable DIV) */}
            <div className="flex flex-col md:flex-row justify-between gap-6 w-full max-w-4xl mx-auto">
              {/* Municipal Mayor */}
              <div className="group relative flex-1 flex flex-col justify-between overflow-hidden border border-fantas-100/30 bg-fantas-200/10 p-6  select-none transition-all duration-300 ease-out">
                {/* sliding wipe background */}
                <div
                  className="absolute inset-0 bg-fantas-900 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <h3 className="text-2xl font-axis-titular-focus text-fantas-900 group-hover:text-white tracking-[0.015em] mb-2 leading-snug transition-colors duration-300">
                    {data.council.mayor.name}
                  </h3>
                  <div className='flex flex-row items-center gap-2'>
                  <span className="text-[12px] font-axis-navbar-focus text-fantas-800 group-hover:text-white/80 uppercase tracking-wider bg-fantas-50 group-hover:bg-white/10 px-1.5 py-1 transition-colors duration-300">
                    Mayor
                  </span>
                  <p className="text-xs font-axis-subtitular-focus text-fantas-900/60 group-hover:text-fantas-100/80 transition-colors duration-300 uppercase tracking-wider">
                    Elected: {data.council.mayor.year_elected} •{' '}
                    {data.council.mayor.term}
                    </p>
                  </div>
                </div>
              </div>

              {/* Municipal Vice Mayor */}
              <div className="group relative flex-1 flex flex-col justify-between overflow-hidden  border border-fantas-100/30 bg-fantas-200/10 p-6  select-none transition-all duration-300 ease-out">
                <div
                  className="absolute inset-0 bg-fantas-900 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col items-center text-center">

                  <h3 className="text-2xl font-axis-titular-focus text-fantas-900 group-hover:text-white tracking-wide mb-2 leading-snug transition-colors duration-300">
                    {data.council.vice_mayor.name}
                  </h3>
                  <div className='flex flex-row items-center gap-2'>
                  <span className="text-[12px] font-axis-navbar-focus text-fantas-800 group-hover:text-white/80 uppercase tracking-wider bg-fantas-50 group-hover:bg-white/10 px-1.5 py-1  self-start transition-colors duration-300">
                  Vice Mayor
                  </span>
                  <p className="text-xs font-axis-subtitular-focus text-fantas-900/60 group-hover:text-fantas-100/80 transition-colors duration-300 uppercase tracking-wider">
                    Elected: {data.council.vice_mayor.year_elected} •{' '}
                    {data.council.vice_mayor.term}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 🏛️ SPACE 2: Sangguniang Bayan (💡 REDESIGNED: Classroom Desk Floor Plan Layout) */}
            <div className="w-full max-w-4xl mx-auto pt-8 border-t border-gray-100 space-y-8">
              {/* Legislative Header */}
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-axis-titular-focus uppercase text-gray-900 tracking-wide">
                  Sangguniang Bayan
                </h2>
                <p className="text-[10px] font-axis-navbar-focus text-gray-500 uppercase tracking-widest mt-1">
                  Councilors of the Municipality of Infanta
                </p>
              </div>

              {/* Classroom Seating Arrangement */}
              <div className="w-full max-w-2xl mx-auto space-y-6 pt-4">
                {/* Desk Row 0: Front of Room / Speaker Podium indicator */}
                <div className="text-center">
                  <span className="inline-block px-8 py-1.5 border border-dashed border-gray-200/80  text-[12px] font-axis-navbar-focus text-gray-600 uppercase tracking-widest bg-gray-200/40">
                    Presiding Officer / Vice Mayor
                  </span>
                </div>

                {/* Desk Rows Container */}
                <div className="flex flex-col gap-6 items-center">
                  {/* Row 1 (Front Desks): Councilors 1 to 4 */}
                  <div className="flex justify-center gap-3 sm:gap-6 w-full">
                    {data.council.councilors.slice(0, 4).map(member => {
                      const surname = getSurname(member.name);
                      return (
                        <div
                          key={member.slug}
                          className="relative group shrink-0"
                        >
                          {/* Circle Seat Node (Non-clickable DIV) */}
                          <div className="size-12 sm:size-16  flex flex-col items-center justify-center border border-fantas-400 bg-fantas-50/10 text-fantas-800 group-hover:bg-fantas-600 group-hover:text-white transition-all duration-300  hover:scale-105 select-none cursor-help">
                            <span className="text-[8px] sm:text-[10px] font-axis-navbar-focus text-center uppercase tracking-wider font-semibold break-all px-1">
                              {surname}
                            </span>
                          </div>

                          {/* Hover Tooltip Popover Card */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 p-3 w-44 bg-white border border-gray-200/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center pointer-events-none transform translate-y-1 group-hover:translate-y-0">
                            <h3 className="mb-1 font-axis-navbar-focus text-gray-900 leading-snug font-semibold text-[12px] uppercase tracking-wide">
                              {member.name}
                            </h3>
                            <div className='flex flex-row justify-center gap-2'>
                              <span className="block text-[10px] bg-fantas-100 text-fantas-800 uppercase font-axis-navbar-focus tracking-wider mb-0 px-1">
                                {member.term}
                              </span>
                              <span className="block text-[10px] text-gray-700 font-axis-subtitular-focus uppercase tracking-wide">
                                First Elected: {member.year_debut}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 2 (Back Desks): Councilors 5 to 8 */}
                  <div className="flex justify-center gap-3 sm:gap-6 w-full">
                    {data.council.councilors.slice(4, 8).map(member => {
                      const surname = getSurname(member.name);
                      return (
                        <div
                          key={member.slug}
                          className="relative group shrink-0"
                        >
                          <div className="size-12 sm:size-16  flex flex-col items-center justify-center border border-fantas-400 bg-fantas-50/10 text-fantas-800 group-hover:bg-fantas-600 group-hover:text-white transition-all duration-300   hover:scale-105 select-none cursor-help">
                            <span className="text-[8px] sm:text-[10px] font-axis-navbar-focus text-center uppercase tracking-wider font-semibold break-all px-1">
                              {surname}
                            </span>
                          </div>

                          {/* Hover Tooltip Popover Card */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 p-3 w-44 bg-white border border-gray-200/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center pointer-events-none transform translate-y-1 group-hover:translate-y-0">
                            <h3 className="mb-1 font-axis-navbar-focus text-gray-900 leading-snug font-semibold text-[12px] uppercase tracking-wide">
                              {member.name}
                            </h3>
                            <div className='flex flex-row justify-center gap-2'>
                              <span className="block text-[10px] bg-fantas-100 text-fantas-800 uppercase font-axis-navbar-focus tracking-wider mb-0 px-1">
                                {member.term}
                              </span>
                              <span className="block text-[10px] text-gray-700 font-axis-subtitular-focus uppercase tracking-wide">
                                First Elected: {member.year_debut}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seating Map Legend */}
              <div className="flex justify-center items-center gap-6 pt-6 text-[9px] font-axis-navbar-focus uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="size-3 border border-fantas-400 bg-fantas-50/10 shrink-0" />
                  <span>Municipal Councilors</span>
                </div>
                {/*<div className="flex items-center gap-1.5">
                  <div className="size-3  border border-arvore-400 bg-arvore-50/10 shrink-0" />
                  <span>Ex-Officio Members</span>
                </div>*/}
              </div>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
