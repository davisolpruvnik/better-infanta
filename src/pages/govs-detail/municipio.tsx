// src/pages/Municipio.tsx
import { useMemo } from 'react';
import yaml from 'js-yaml';
import SEO from '@/components/SEO';
import Breadcrumbsless from '@/components/ui/BreadcrumbsLess';
import Section from '@/components/ui/Section';
import { Popover } from '@base-ui/react';

// Static raw import of your Municipio content index
import municipioYamlContent from '../../../content/government/lgu/municipio/index.yaml?raw';

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

const getDisambiguatedSurname = (fullName: string, membersList: Councilor[]): string => {
  const surname = getSurname(fullName);
  const firstInitial = fullName.trim().charAt(0).toUpperCase();

  // Check if any other council member shares the exact same surname
  const duplicatesCount = membersList.filter(
    m => getSurname(m.name).toLowerCase() === surname.toLowerCase()
  ).length;

  return duplicatesCount > 1 ? `${surname}, ${firstInitial}.` : surname;
};

export default function Municipio() {
  const data = useMemo(() => {
    return yaml.load(municipioYamlContent) as CouncilData;
  }, []);

  // 💡 Reference array of all legislative members to detect matching surnames
  const chamberMembers = useMemo(() => {
    if (!data?.council) return [];
    const list: Councilor[] = [...(data.council.councilors || [])];
    if (data.council.vice_mayor) list.push(data.council.vice_mayor);
    return list;
  }, [data]);

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
          <h1 className="text-3xl sm:text-4xl font-axis-titular-focus uppercase text-gray-900 mt-4 tracking-wide leading-snug">
            Executive & Legislative Branch
          </h1>
          <p className="text-sm font-axis-subtitular-focus text-gray-500 tracking-wide uppercase mt-1">
            Municipality of Infanta, Quezon
          </p>
        </div>

        {data?.council && (
          <div className="space-y-16">
            {/* 👑 SPACE 1: Executive Cards (Hover on desktop / Tap-responsive on mobile) */}
            <div className="flex flex-col md:flex-row justify-between gap-6 w-full max-w-4xl mx-auto">

              {/* Municipal Mayor */}
              <div className="group relative flex-1 flex flex-col justify-between overflow-hidden border border-fantas-100/30 bg-fantas-200/10 p-6 select-none transition-all duration-300 ease-out active:scale-[0.99] cursor-default">
                <div
                  className="absolute inset-0 bg-fantas-900 -translate-x-full group-hover:translate-x-0 group-active:translate-x-0 transition-transform duration-300 ease-out z-0"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <h3 className="text-2xl font-axis-titular-focus text-fantas-900 group-hover:text-white group-active:text-white tracking-[0.015em] mb-2 leading-snug transition-colors duration-300">
                    {data.council.mayor.name}
                  </h3>
                  <div className="flex flex-row items-center gap-2">
                    <span className="text-[12px] font-axis-navbar-focus text-fantas-800 group-hover:text-white/80 group-active:text-white/80 uppercase tracking-wider bg-fantas-50 group-hover:bg-white/10 group-active:bg-white/10 px-1.5 py-1 transition-colors duration-300">
                      Mayor
                    </span>
                    <p className="text-xs font-axis-subtitular-focus text-fantas-900/60 group-hover:text-fantas-100/80 group-active:text-fantas-100/80 transition-colors duration-300 uppercase tracking-wider">
                      Elected: {data.council.mayor.year_elected} • {data.council.mayor.term}
                    </p>
                  </div>
                </div>
              </div>

              {/* Municipal Vice Mayor */}
              <div className="group relative flex-1 flex flex-col justify-between overflow-hidden border border-fantas-100/30 bg-fantas-200/10 p-6 select-none transition-all duration-300 ease-out active:scale-[0.99] cursor-default">
                <div
                  className="absolute inset-0 bg-fantas-900 -translate-x-full group-hover:translate-x-0 group-active:translate-x-0 transition-transform duration-300 ease-out z-0"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <h3 className="text-2xl font-axis-titular-focus text-fantas-900 group-hover:text-white group-active:text-white tracking-wide mb-2 leading-snug transition-colors duration-300">
                    {data.council.vice_mayor.name}
                  </h3>
                  <div className="flex flex-row items-center gap-2">
                    <span className="text-[12px] font-axis-navbar-focus text-fantas-800 group-hover:text-white/80 group-active:text-white/80 uppercase tracking-wider bg-fantas-50 group-hover:bg-white/10 group-active:bg-white/10 px-1.5 py-1 self-start transition-colors duration-300">
                      Vice Mayor
                    </span>
                    <p className="text-xs font-axis-subtitular-focus text-fantas-900/60 group-hover:text-fantas-100/80 group-active:text-fantas-100/80 transition-colors duration-300 uppercase tracking-wider">
                      Elected: {data.council.vice_mayor.year_elected} • {data.council.vice_mayor.term}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 🏛️ SPACE 2: Sangguniang Bayan Classroom Desks */}
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
                {/* Desk Row 0: Presiding Officer Podium */}
                <div className="text-center">
                  <div className="flex justify-center">
                                    <Popover.Root>
                                      <Popover.Trigger
                                        openOnHover
                                        className="w-24 h-14 sm:w-28 sm:h-16 flex flex-col items-center justify-center border-2 border-fantas-600 bg-fantas-100/40 text-fantas-950 hover:bg-fantas-900 hover:text-white data-[state=open]:bg-fantas-900 data-[state=open]:text-white transition-all duration-200 hover:scale-105 active:scale-95 select-none cursor-pointer outline-none  shrink-0"
                                        aria-label={`View profile details for ${data.council.vice_mayor.name} (Presiding Officer)`}
                                      >
                                        <span className="text-[7px] sm:text-[8px] font-axis-navbar-focus uppercase tracking-widest opacity-75 leading-none mb-1">
                                          Presiding Officer
                                        </span>
                                        <span className="text-[10px] sm:text-[12px] font-axis-navbar-focus text-center uppercase tracking-wider font-bold leading-tight px-1">
                                          {getDisambiguatedSurname(data.council.vice_mayor.name, chamberMembers)}
                                        </span>
                                      </Popover.Trigger>

                                      <Popover.Portal>
                                        <Popover.Positioner side="top" sideOffset={8} className="z-50">
                                          <Popover.Popup className="z-50 p-3 w-52 bg-white border border-gray-200/80  text-center origin-[var(--transform-origin)] transition-all duration-200 ease-out data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:translate-y-1 outline-none">
                                            <h3 className="mb-1 font-axis-navbar-focus text-gray-900 leading-snug font-semibold text-[12px] uppercase tracking-wide">
                                              {data.council.vice_mayor.name}
                                            </h3>
                                            <span className="block text-[10px] text-fantas-800 font-axis-navbar-focus uppercase tracking-wider mb-1.5">
                                              Presiding Officer / Vice Mayor
                                            </span>
                                            <div className="flex flex-row justify-center items-center gap-2">
                                              <span className="block text-[10px] bg-fantas-100 text-fantas-800 uppercase font-axis-navbar-focus tracking-wider px-1.5 py-0.5">
                                                {data.council.vice_mayor.term}
                                              </span>
                                              <span className="block text-[10px] text-gray-700 font-axis-subtitular-focus uppercase tracking-wide">
                                                Elected: {data.council.vice_mayor.year_elected}
                                              </span>
                                            </div>
                                          </Popover.Popup>
                                        </Popover.Positioner>
                                      </Popover.Portal>
                                    </Popover.Root>
                                  </div>
                </div>

                {/* Desk Rows Container */}
                <div className="flex flex-col gap-6 items-center">

                  {/* Row 1 (Front Desks): Councilors 1 to 4 */}
                  <div className="flex justify-center gap-3 sm:gap-6 w-full">
                    {data.council.councilors.slice(0, 4).map(member => {
                      const surname = getDisambiguatedSurname(member.name, chamberMembers);
                      return (
                        <Popover.Root key={member.slug}>
                          <Popover.Trigger
                            openOnHover
                            className="size-12 sm:size-16 flex flex-col items-center justify-center border border-fantas-400 bg-fantas-50/10 text-fantas-800 hover:bg-fantas-600 hover:text-white data-[state=open]:bg-fantas-600 data-[state=open]:text-white transition-all duration-200 hover:scale-105 active:scale-95 select-none cursor-pointer outline-none shrink-0"
                            aria-label={`View profile details for ${member.name}`}
                          >
                            <span className="text-[8px] sm:text-[10px] font-axis-navbar-focus text-center uppercase tracking-wider font-semibold break-all px-1">
                              {surname}
                            </span>
                          </Popover.Trigger>

                          <Popover.Portal>
                            <Popover.Positioner side="top" sideOffset={8} className="z-50">
                              <Popover.Popup className="z-50 p-3 w-48 bg-white border border-gray-200/80  text-center origin-[var(--transform-origin)] transition-all duration-200 ease-out data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:translate-y-1 outline-none">
                                <h3 className="mb-1 font-axis-navbar-focus text-gray-900 leading-snug font-semibold text-[12px] uppercase tracking-wide">
                                  {member.name}
                                </h3>
                                <div className="flex flex-row justify-center items-center gap-2">
                                  <span className="block text-[10px] bg-fantas-100 text-fantas-800 uppercase font-axis-navbar-focus tracking-wider px-1">
                                    {member.term}
                                  </span>
                                  {member.year_debut && (
                                    <span className="block text-[10px] text-gray-700 font-axis-subtitular-focus uppercase tracking-wide">
                                      First Elected: {member.year_debut}
                                    </span>
                                  )}
                                </div>
                              </Popover.Popup>
                            </Popover.Positioner>
                          </Popover.Portal>
                        </Popover.Root>
                      );
                    })}
                  </div>

                  {/* Row 2 (Back Desks): Councilors 5 to 8 */}
                  <div className="flex justify-center gap-3 sm:gap-6 w-full">
                    {data.council.councilors.slice(4, 8).map(member => {
                      const surname = getDisambiguatedSurname(member.name, chamberMembers);
                      return (
                        <Popover.Root key={member.slug}>
                          <Popover.Trigger
                            openOnHover
                            className="size-12 sm:size-16 flex flex-col items-center justify-center border border-fantas-400 bg-fantas-50/10 text-fantas-800 hover:bg-fantas-600 hover:text-white data-[state=open]:bg-fantas-600 data-[state=open]:text-white transition-all duration-200 hover:scale-105 active:scale-95 select-none cursor-pointer outline-none shrink-0"
                            aria-label={`View profile details for ${member.name}`}
                          >
                            <span className="text-[8px] sm:text-[10px] font-axis-navbar-focus text-center uppercase tracking-wider font-semibold break-all px-1">
                              {surname}
                            </span>
                          </Popover.Trigger>

                          <Popover.Portal>
                            <Popover.Positioner side="top" sideOffset={8} className="z-50">
                              <Popover.Popup className="z-50 p-3 w-48 bg-white border border-gray-200/80  text-center origin-[var(--transform-origin)] transition-all duration-200 ease-out data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:translate-y-1 outline-none">
                                <h3 className="mb-1 font-axis-navbar-focus text-gray-900 leading-snug font-semibold text-[12px] uppercase tracking-wide">
                                  {member.name}
                                </h3>
                                <div className="flex flex-row justify-center items-center gap-2">
                                  <span className="block text-[10px] bg-fantas-100 text-fantas-800 uppercase font-axis-navbar-focus tracking-wider px-1">
                                    {member.term}
                                  </span>
                                  {member.year_debut && (
                                    <span className="block text-[10px] text-gray-700 font-axis-subtitular-focus uppercase tracking-wide">
                                      First Elected: {member.year_debut}
                                    </span>
                                  )}
                                </div>
                              </Popover.Popup>
                            </Popover.Positioner>
                          </Popover.Portal>
                        </Popover.Root>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* Seating Map Legend */}
              <div className="flex justify-center items-center gap-6 pt-6 text-[9px] font-axis-navbar-focus uppercase tracking-wider text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <div className="size-3.5 border-2 border-fantas-600 bg-fantas-100/40 shrink-0" />
                                <span>Presiding Officer</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="size-3.5 border border-fantas-400 bg-fantas-50/10 shrink-0" />
                                <span>Municipal Councilors</span>
                              </div>
                            </div>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
