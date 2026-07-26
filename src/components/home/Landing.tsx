import {
  FileText,
  Landmark,
  LucideSquareActivity,
  SearchIcon,
} from 'lucide-react';
// import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from '../ui/new-coms/autocomplete';

const items = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Orange', value: 'orange' },
  { label: 'Grape', value: 'grape' },
  { label: 'Strawberry', value: 'strawberry' },
  { label: 'Mango', value: 'mango' },
  { label: 'Pineapple', value: 'pineapple' },
  { label: 'Kiwi', value: 'kiwi' },
  { label: 'Peach', value: 'peach' },
  { label: 'Pear', value: 'pear' },
];

export default function LandingSite() {
  // const { t } = useTranslation();
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left section with title and search */}
          <div className="animate-fade-in">
            <h2 className="tracking-wide text-3xl md:text-4xl lg:text-5xl font-axis-chunky mb-4 leading-relaxed">
              Better Infanta
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-gray-300 tracking-wide">
              A community-run platform for unified local government services
              accessibility of the Municipality of Infanta, Quezon.
            </p>
          </div>
          <div className="rounded-2xl bg-accent-50/15">
            {/* Section Header */}
            <div className="text-center pt-8 text-xs font-axis-bold uppercase tracking-widest text-accent-50/70">
              Quick Access
            </div>

            <div className="p-8 pb-0">
              <Autocomplete items={items}>
                <AutocompleteInput
                  aria-label="Search for a service"
                  placeholder="Search for a service (e.g. business, health)"
                  startAddon={<SearchIcon />}
                  className="h-10 p-1 rounded-lg"
                />
                <AutocompletePopup>
                  <AutocompleteEmpty>No items found.</AutocompleteEmpty>
                  <AutocompleteList className="max-h-60">
                    {item => (
                      <AutocompleteItem
                        key={item.value}
                        value={item}
                        className="py-2.5"
                      >
                        {item.label}
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompletePopup>
              </Autocomplete>
            </div>

            {/* Unified Grid Layout for 3 Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-stretch p-8 gap-4 text-center">
              {/* Services Card */}
              <Link
                to="/services"
                className="flex flex-col items-center justify-center p-6 bg-accent-50/5 hover:bg-accent-50/15 border border-accent-50/5 hover:border-accent-50/20 rounded-xl transition duration-300"
              >
                <Landmark className="fill-white" />
                <h3 className="text-md font-axis-bold mt-4 text-white">
                  Services
                </h3>
                <p className="text-xs text-gray-300/90 tracking-wide leading-relaxed">
                  LGU permits, licenses, etc.
                </p>
              </Link>

              {/* Safety Card */}
              <Link
                to="/finances"
                className="flex flex-col items-center justify-center p-2 bg-accent-50/5 hover:bg-accent-50/15 border border-accent-50/5 hover:border-accent-50/20 rounded-xl transition duration-300"
              >
                <LucideSquareActivity />
                <h3 className="text-md font-axis-bold mt-4 text-white">
                  Finances
                </h3>
                <p className="text-xs text-gray-300/90 tracking-wide leading-relaxed">
                  Where the money goes
                </p>
              </Link>

              {/* News Card */}
              <Link
                to="/transparency"
                className="flex flex-col items-center justify-center p-6 bg-accent-50/5 hover:bg-accent-50/15 border border-accent-50/5 hover:border-accent-50/20 rounded-xl transition duration-300"
              >
                <FileText />
                <h3 className="text-md font-axis-bold mt-4 text-white">
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
