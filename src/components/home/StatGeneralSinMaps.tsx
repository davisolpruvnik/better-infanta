// 💡 Authentic demographics for Infanta, Quezon (2020 Census / Official Data)
const INFANTA_STATS = {
  barangays: '36',
  area: '342.76 km²',
  population: '77,676',
};

export default function TownStats() {
  return (
    <div className="container mx-auto px-4 bg-cream-50/20 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* 📊 LEFT COLUMN: Municipal Metrics Grid (cols-2) */}
        <div className="flex flex-col justify-start h-full space-y-6">
          <div className="text-center md:text-start mb-8">
            <h2 className="text-4xl md:text-4xl lg:text-5xl font-axis-titular-focus uppercase text-gray-900 tracking-wider">
              General Statistics
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Stat 1: Barangays */}
            <div className="flex flex-col text-start border-l-2 border-primary-500 pl-4">
              <span className="block uppercase text-[14px] font-axis-sng-indlab-header text-gray-500 tracking-widest">
                Barangays
              </span>
              <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-none proportional-nums tracking-wide">
                {INFANTA_STATS.barangays}
              </span>
              <span className="text-[12px] text-gray-400 font-axis-thin mt-1">
                Urban & Rural Divisions
              </span>
            </div>

            {/* Stat 2: Area Size */}
            <div className="flex flex-col text-start border-l-2 border-primary-500 pl-4">
              <span className="block uppercase text-[14px] font-axis-sng-indlab-header text-gray-500 tracking-widest">
                Land Area
              </span>
              <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-none proportional-nums tracking-wide">
                {INFANTA_STATS.area}
              </span>
              <span className="text-[12px] text-gray-400 font-axis-thin mt-1">
                Total Administrative Size
              </span>
            </div>

            {/* Stat 3: Population (Spans full width for grid-cols-2 balance) */}
            <div className="col-span-2 flex flex-col text-start border-l-2 border-primary-500 pl-4 mt-2">
              <span className="block uppercase text-[14px] font-axis-sng-indlab-header text-gray-500 tracking-widest">
                Population Size
              </span>
              <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-none proportional-nums tracking-wide">
                {INFANTA_STATS.population}
              </span>
              <span className="text-[12px] text-gray-400 font-axis-thin mt-1">
                Based on Official 2024 National Census data
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
