import { ParsedServiceDoc } from "@/types/serviceDocuments";
import { Popover } from "@base-ui/react";
import { ReactNode } from "react";

interface DocumentHeaderProps {
  doc: ParsedServiceDoc;
  renderIcon: (name: string, className?: string) => ReactNode;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ doc, renderIcon }) => {
  return (
    <div className="mb-8 justify-between items-start gap-6 flex flex-col lg:flex-row border-b border-gray-100 pb-6">
      <div className="flex-1 min-w-0 text-center lg:text-start">
        <span className="text-[10px] sm:text-[12px] font-axis-navbar-focus text-fantas-800 uppercase tracking-widest bg-fantas-50 px-2.5 py-1 rounded">
          Citizen Charter Guide
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-axis-titular-focus uppercase text-fantas-900 mt-3 tracking-wide leading-snug break-words text-wrap max-w-lg md:max-w-xl lg:max-w-2xl mx-auto lg:mx-0">
          {doc.title}
        </h1>
        {doc.description && (
          <p className="text-lg text-fantas-900/80 mt-2 leading-snug tracking-wide font-axis-subtitular-focus mx-auto lg:mx-0 break-words text-wrap hyphens-auto max-w-2xl md:max-w-3xl lg:max-w-3xl">
            {doc.description}
          </p>
        )}
      </div>

      {doc.isStructured && (
        <div className="flex flex-col items-center lg:items-end text-center lg:text-end gap-4 shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0">
          <div className="flex items-center justify-center lg:justify-end gap-6 sm:gap-6 md:gap-8 lg:gap-8 w-full lg:w-auto">
            <div className="relative flex flex-col items-center lg:items-end text-center lg:text-end">
              <div className="flex flex-row items-center">
                <span className="block uppercase text-[14px] xs:text-[12px] font-axis-sng-indlab-header text-fantas-900/80 tracking-widest">
                  Estimated Cost
                </span>
                {doc.feeDetails && (
                  <Popover.Root>
                    <Popover.Trigger
                      openOnHover
                      className="inline-flex items-center justify-center px-1 rounded-full text-fantas-900/60 hover:text-fantas-950 hover:bg-fantas-50/50 transition-colors focus:outline-none cursor-pointer"
                    >
                      {renderIcon('tabler:help-circle', 'h-4 w-4')}
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Positioner side="bottom" sideOffset={6}>
                        <Popover.Popup className="z-50 max-w-xs p-2.5 bg-white border border-gray-200 rounded-xl shadow-lg text-[10px] leading-relaxed text-fantas-900/80 normal-case origin-[var(--transform-origin)] transition-all duration-200 ease-out data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[ending-style]:scale-90 data-[ending-style]:opacity-0">
                          <span className="block text-[9px] font-axis-bold text-fantas-700 uppercase tracking-wider mb-1 select-none">
                            Calculation Basis
                          </span>
                          {doc.feeDetails}
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-2xl xs:text-2xl sm:text-2xl md:text-3xl lg:text-3xl font-axis-sng-indlab-value text-fantas-950 tracking-wide">
                  {doc.fees || 'Free / No Fees'}
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-200/80 self-center" aria-hidden="true" />

            <div className="relative flex flex-col items-center lg:items-end text-center lg:text-end">
              <span className="text-[14px] font-axis-sng-indlab-header text-fantas-900/80 uppercase tracking-widest">
                Processing Time
              </span>
              <span className="text-2xl xs:text-2xl sm:text-2xl md:text-3xl lg:text-3xl font-axis-sng-indlab-value text-fantas-950 mt-1 proportional-nums tracking-wide">
                {doc.time || 'Immediate / Walk-In'}
              </span>
            </div>
          </div>

          {doc.office && (
            <div className="flex flex-col items-center lg:items-end w-full">
              <span className="text-[16px] font-axis-sng-indlab-header text-fantas-900/80 uppercase tracking-widest">
                Where to Apply
              </span>
              <span className="text-xl font-axis-sng-indlab-value text-fantas-950 mt-1.5 leading-snug xs:tracking-normal sm:tracking-normal md:tracking-wide lg:tracking-wide">
                {doc.office}
              </span>
              <span className="inline-block max-w-lg text-sm font-axis-navbar-focus text-fantas-900/60 tracking-wide mt-0.5 text-pretty line-clamp-1">
                {doc.officeAddress}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
