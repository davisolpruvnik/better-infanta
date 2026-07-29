import { FileText, Landmark, LucideSquareActivity } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function LandingSite() {
  // const { t } = useTranslation();
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 md:py-24">
      <div className="container mx-auto px-4 flex flex-col gap-10">
        {/* 1. TOP SECTION: Better Infanta Branding Block */}
        <div className="animate-fade-in max-w-3xl">
          <h2 className="tracking-wide text-3xl md:text-4xl lg:text-5xl font-axis-chunky mb-4 leading-relaxed">
            Better Infanta
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-300 tracking-wide">
            A community-run platform for unified local government services
            accessibility of the Municipality of Infanta, Quezon.
          </p>
        </div>

        <div className="hidden lg:block w-full h-px bg-accent-50/20" />

        {/* 2. BOTTOM SECTION: Realigned Quick Access Container */}
        <div className="rounded-2xl p-8 flex flex-col gap-8">
          {/* Quick Access Label + Vertical Separator + Unchanged Cards Grid */}
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Label & Separator */}
            <div className="flex items-center gap-8 shrink-0">
              <div className="text-xs font-axis-bold uppercase tracking-widest text-accent-50/70">
                Quick Access Here
              </div>
              {/* Vertical separator shown only on large/desktop viewports */}
              <div className="hidden lg:block h-12 w-px bg-accent-50/20" />
            </div>

            {/* Unchanged Grid Layout for the 3 Service Items */}
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5 items-stretch gap-4 text-center flex-grow w-full font-axis-sng-indlabel-value">
              {/* Services Card */}
              <Link
                to="/services"
                className="flex flex-col items-center justify-center p-6 bg-accent-50/5 hover:bg-accent-50/15 border border-accent-50/5 hover:border-accent-50/20 rounded-xl transition duration-300"
              >
                <Landmark className="fill-white" />
                <h3 className="text-md font-axis-bold mt-4 text-white tracking-wider font-axis-titular-focus uppercase">
                  Services
                </h3>
                <p className="text-xs text-gray-300/90 tracking-wide leading-relaxed">
                  LGU permits, licenses, etc.
                </p>
              </Link>

              {/* Finances Card */}
              <Link
                to="/finances"
                className="flex flex-col items-center justify-center p-2 bg-accent-50/5 hover:bg-accent-50/15 border border-accent-50/5 hover:border-accent-50/20 rounded-xl transition duration-300"
              >
                <LucideSquareActivity />
                <h3 className="text-md font-axis-bold mt-4 text-white tracking-wider font-axis-titular-focus uppercase">
                  Finances
                </h3>
                <p className="text-xs text-gray-300/90 tracking-wide leading-relaxed">
                  Where the money goes
                </p>
              </Link>

              {/* Transparency Card */}
              <Link
                to="/transparency"
                className="flex flex-col items-center justify-center p-6 bg-accent-50/5 hover:bg-accent-50/15 border border-accent-50/5 hover:border-accent-50/20 rounded-xl transition duration-300"
              >
                <FileText />
                <h3 className="text-md font-axis-bold mt-4 text-white tracking-wider font-axis-titular-focus uppercase">
                  Transparency
                </h3>
                <p className="text-xs text-gray-300/90 tracking-wide leading-relaxed">
                  Biddings and contracts
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
