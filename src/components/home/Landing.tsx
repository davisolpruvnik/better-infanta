import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GooeyInput } from '@/components/ui/gooey-input';
import { useWeather } from '@/hooks/useWeather';
import { WEATHER_LOCATIONS } from '@/components/config/weather-config';
import { getCategorySubcategories, serviceCategories } from '@/data/yamlLoader';
import logoImg from '../../assets/better_infanta_logotemp.svg';

const LazyIconify = lazy(() =>
  import('@iconify/react').then(m => ({ default: m.Icon }))
);

export default function LandingSite() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchableServices, setSearchableServices] = useState<
    { label: string; category: string; slug: string }[]
  >([]);

  // 💡 Device Screen Listener for Adaptive GooeyInput Sizing
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Responsive props for GooeyInput per screen size
  const gooeyCollapsedWidth = isMobile ? 130 : isTablet ? 180 : 240;
  const gooeyExpandedWidth = isMobile ? 260 : isTablet ? 310 : 360;
  const gooeyExpandedOffset = isMobile ? 30 : isTablet ? 40 : 50;

  // 💡 FAIL-SAFE LOAD OF ALL CATEGORIES & SUBCATEGORIES ({another_slug}) FROM yamlLoader
  useEffect(() => {
    let isMounted = true;

    async function loadAllYamlServices() {
      // 1. Immediately extract base categories (Synchronous & instant)
      const baseItems: { label: string; category: string; slug: string }[] = [];
      const categoriesList = serviceCategories?.categories || [];

      categoriesList.forEach((cat: any) => {
        if (cat?.category && cat?.slug) {
          baseItems.push({
            label: cat.category,
            category: 'Service Category',
            slug: `/services/${cat.slug}`,
          });
        }
      });

      // Set base items first so search works instantly
      if (isMounted) setSearchableServices(baseItems);

      // 2. Fetch subcategories in parallel with Promise.allSettled (Fail-safe)
      const subcategoryPromises = categoriesList.map(async (cat: any) => {
        try {
          const subData = await getCategorySubcategories(cat.slug);
          const pages = subData?.pages || [];
          return pages.map((sub: any) => ({
            label: sub.name || sub.title || sub.slug,
            category: cat.category || 'Service',
            slug: `/services/${cat.slug}/${sub.slug}`, // ➔ /services/{category}/{another_slug}
          }));
        } catch {
          return []; // Return empty array on error so other categories don't fail
        }
      });

      const results = await Promise.allSettled(subcategoryPromises);
      const allSubItems: { label: string; category: string; slug: string }[] = [];

      results.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          allSubItems.push(...res.value);
        }
      });

      if (isMounted) {
        // Combine base categories and dynamic subcategories
        setSearchableServices([...baseItems, ...allSubItems]);
      }
    }

    loadAllYamlServices();

    return () => {
      isMounted = false;
    };
  }, []);

  // 💡 Filter Search Results from YAML Data
  const searchResults = searchValue.trim()
    ? searchableServices.filter(
        (item) =>
          item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.category.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  // 💡 LIVE WEATHER DATA INTEGRATION (Defaults to Infanta - Index 0)
  const { data: liveWeather } = useWeather(WEATHER_LOCATIONS[0]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // Quick search tags
  const quickSearchTerms = [
    { label: 'Business Permit', slug: '/services/business-permit' },
    { label: 'Birth Certificate', slug: '/services/birth-certificate' },
    { label: 'Building Permit', slug: '/services/building-permit' },
  ];

  // 💡 COMPACT TV BROADCAST WEATHER DATA
  const townWeather = {
    name: liveWeather?.name ?? 'Infanta (Poblacion)',
    aqi: liveWeather?.aqi ?? 24,
    temp: liveWeather ? `${liveWeather.temp}°` : '29°',
    condition: liveWeather?.condition.label ?? 'Thunderstorms',
    minTemp: liveWeather ? `${liveWeather.minTemp}°` : '24°',
    maxTemp: liveWeather ? `${liveWeather.maxTemp}°` : '31°',
    feelsLike: liveWeather ? `${liveWeather.feelsLike}°` : '33°',
    rainChance: liveWeather ? `${liveWeather.rainChance}%` : '20%',
    winds: liveWeather ? `${liveWeather.windSpeed}-${liveWeather.windGusts} kph` : '12 kph',
    humidity: liveWeather ? `${liveWeather.humidity}%` : '75%',
    icon: liveWeather?.condition.icon ?? 'lucide:cloud-lightning',
    sunrise: liveWeather ? `${liveWeather.sunrise}` : '',
    sunset: liveWeather ? `${liveWeather.sunset}` : ''
  };

  // 💡 INTERNATIONAL STANDARD AQI COLOR MAPPING (Light mode compliant)
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-emerald-100 text-emerald-800 border-emerald-300'; // Good
    if (aqi <= 100) return 'bg-amber-100 text-amber-800 border-amber-300'; // Moderate
    if (aqi <= 150) return 'bg-orange-100 text-orange-800 border-orange-300'; // Unhealthy Sensitive
    if (aqi <= 200) return 'bg-rose-100 text-rose-800 border-rose-300'; // Unhealthy
    if (aqi <= 300) return 'bg-purple-100 text-purple-800 border-purple-300'; // Very Unhealthy
    return 'bg-rose-900 text-white border-rose-950'; // Hazardous
  };

  // Stats data
  const statsData = [
    { label: 'Barangays', value: '36', icon: 'lucide:layers' },
    { label: 'Income Class', value: '1st', icon: 'lucide:shield-check' },
    { label: 'Population, 2024', value: '77,676', icon: 'lucide:users' },
    { label: 'Area (in sq km)', value: '342.76', icon: 'lucide:file-text' },
  ];

  const getIcon = (iconName: string, className = 'h-5 w-5') => (
    <Suspense fallback={<div className={`${className} bg-stone-200 rounded animate-pulse`} />}>
      <LazyIconify icon={iconName} className={className} />
    </Suspense>
  );

  return (
    <div className="relative overflow-hidden bg-fantas-50 text-slate-900 py-8 sm:py-12 md:py-20 border-b border-stone-200">
      {/* Subtle Background Accent Warmth */}
      <div className="absolute top-0 -left-20 w-64 sm:w-96 h-64 sm:h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-8 sm:px-12 relative z-10 flex flex-col gap-8 sm:gap-10 md:gap-14">

        {/* ========================================================= */}
        {/* 1. TOP SECTION: LOGO + BETTER INFANTA HEADER (2-PART)     */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center border-b border-stone-200 pb-8 sm:pb-10">

          {/* TOP RIGHT: Better Infanta Branding Block */}
          <div className="lg:col-span-9 text-center lg:text-left flex flex-col md:flex-row items-center justify-around gap-6 lg:gap-8">
            {/* LOGO */}
            <img
              src={logoImg}
              alt="Better Infanta Logo"
              className="w-48 h-24 sm:w-64 sm:h-36 md:w-84 md:h-48 object-contain shrink-0"
            />

            {/* VERTICAL DIVIDER (Visible on medium/large screens) */}
            <div className="hidden md:block w-px h-24 lg:h-32 bg-fantas-800/30 shrink-0 self-center" />

            {/* HORIZONTAL DIVIDER (Visible on mobile screens) */}
            <div className="block md:hidden w-24 h-px bg-fantas-800/30 my-2" />

            {/* DESCRIPTION */}
            <p className="text-sm sm:text-md md:text-lg lg:text-xl text-fantas-800 font-axis-subtitular-focus max-w-2xl leading-relaxed mx-auto lg:mx-0 uppercase tracking-wider">
              A unified, community-run digital gateway for local government services,
              transparency records, and public municipal accessibility in Infanta, Quezon.
            </p>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 2. BOTTOM SECTION: 3 EQUAL COLUMNS (VERTICALLY DISTRIBUTED) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          {/* 1️⃣ COLUMN 1 (LEFT): Quick Search */}
          <div className="flex flex-col justify-between h-full gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 text-md font-axis-navbar-focus uppercase tracking-widest text-fantas-900">
                {getIcon('lucide:sparkles', 'h-4 w-4')}
                <span>Quick Search</span>
              </div>

              {/* Gooey Input + Live Search Results Overlay */}
              <div className="relative w-full">
                <form onSubmit={handleSearchSubmit} className="flex justify-center my-1 overflow-visible">
                  <GooeyInput
                    placeholder="Search permits, licenses..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                    collapsedWidth={gooeyCollapsedWidth}
                    expandedWidth={gooeyExpandedWidth}
                    expandedOffset={gooeyExpandedOffset}
                    gooeyBlur={4}
                    classNames={{
                      trigger: "bg-white text-fantas-900 border border-stone-200",
                      bubbleSurface: "bg-white text-fantas-900 border border-stone-200",
                      input: "text-slate-900 placeholder:text-gray-600 font-axis-book text-xs sm:text-sm",
                    }}
                  />
                </form>

                {/* 💡 LIVE SEARCH RESULTS DROPDOWN */}
                {searchValue.trim().length > 0 && (
                  <div className="absolute left-0 mt-2 w-full max-w-xs sm:max-w-md bg-white text-fantas-900 rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 divide-y divide-stone-100 max-h-48 overflow-y-auto">
                    <div className="px-3.5 py-1.5 text-[12px] font-axis-navbar-focus text-fantas-800 uppercase tracking-widest">
                      {searchResults.length} Matching Services
                    </div>

                    {searchResults.length > 0 ? (
                      searchResults.map((item, index) => (
                        <Link
                          key={`${item.slug}-${index}`}
                          to={item.slug}
                          onClick={() => setSearchValue('')}
                          className="flex items-center justify-between px-3.5 py-2.5 hover:bg-stone-50 transition-colors text-left group"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm font-axis-bold text-fantas-900 group-hover:text-primary-600 transition-colors">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-fantas-900/60 font-axis-book">
                              {item.category}
                            </span>
                          </div>
                          {getIcon('lucide:chevron-right', 'h-4 w-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all')}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-500 font-axis-book text-center">
                        No matching services found for "{searchValue}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-sm text-gray-600 font-axis-subtitular-focus uppercase tracking-wider pr-1">
                Popular
              </span>
              {quickSearchTerms.map((term) => (
                <Link
                  key={term.slug || term.label}
                  to={term.slug}
                  className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-axis-subtitular-focus bg-white hover:bg-stone-100 border border-stone-200 text-fantas-800 tracking-wide transition-all duration-200 hover:scale-105"
                >
                  {getIcon('tabler:search', 'h-3 w-3 text-fantas-900')}
                  <span>{term.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 2️⃣ COLUMN 2 (MIDDLE): Compact Weather Graphic */}
          <div className="flex flex-col justify-between h-full gap-3 lg:border-l lg:border-stone-200 lg:pl-8 pt-6 lg:pt-0 border-t border-stone-200 lg:border-t-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-md font-axis-navbar-focus uppercase tracking-widest text-fantas-900">
                {getIcon('lucide:cloud-sun', 'h-4 w-4')}
                <span>Local Weather</span>
              </div>

              {/* 📺 COMPACT WEATHER CARD */}
              <div className="w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 flex flex-col bg-fantas-200/50 overflow-hidden">

                {/* 1. Town Name & AQI Badge */}
                <div className="py-2.5 px-3 sm:px-4 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  {/* LEFT SIDE: Town Name & AQI */}
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <h3 className="text-xs sm:text-sm md:text-base font-axis-subtitular-focus uppercase tracking-wider text-fantas-800">
                      {townWeather.name}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] sm:text-[12px] font-axis-navbar-focus rounded-full border tracking-wider transition-colors duration-300 ${getAqiColor(townWeather.aqi)}`}>
                      AQI {townWeather.aqi}
                    </span>
                  </div>

                  {/* RIGHT SIDE: Sunrise & Sunset */}
                  <div className="flex flex-col items-center gap-1 text-[12px] sm:text-[14px] font-axis-navbar-focus text-fantas-900 uppercase tracking-wider">
                    {/* Sunrise */}
                    <div className="flex items-center gap-1" title="Sunrise">
                      {getIcon('tabler:sunrise-filled', 'h-3.5 w-3.5 sm:h-4 sm:w-4 text-fantas-600')}
                      <span>{townWeather.sunrise}</span>
                    </div>

                    {/* Sunset */}
                    <div className="flex items-center gap-1" title="Sunset">
                      {getIcon('tabler:sunset-filled', 'h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-800')}
                      <span>{townWeather.sunset}</span>
                    </div>
                  </div>
                </div>

                {/* Dotted Divider */}
                <div className="w-full border-b border-dotted border-gray-600/80" />

                {/* 2. Temperature Beside Icon & Condition */}
                <div className="py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-center gap-2.5 sm:gap-3 text-center">
                  {getIcon(townWeather.icon, 'h-8 w-8 sm:h-9 sm:w-9 text-fantas-500 shrink-0 drop-shadow-sm')}
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-3xl sm:text-4xl font-axis-sng-indlab-value text-fantas-900 leading-none tracking-wider">
                      {townWeather.temp}
                    </span>
                    <span className="text-[10px] sm:text-xs font-axis-navbar-focus uppercase tracking-wider text-gray-600">
                      FEELS LIKE
                    </span>
                    <span className="text-base sm:text-lg font-axis-sng-indlab-value text-fantas-900 tracking-wider">
                      {townWeather.feelsLike}
                    </span>
                  </div>
                </div>

                {/* Dotted Divider */}
                <div className="w-full border-b border-dotted border-gray-600/80" />

                {/* 3. Minimum | Maximum Columns */}
                <div className="py-2.5 px-2 grid grid-cols-2 text-center divide-x divide-gray-500/80">
                  {/* Minimum Temp */}
                  <div className="flex flex-row justify-center items-center gap-1.5 sm:gap-2 tracking-wider">
                    <span className="text-xs sm:text-[14px] font-axis-navbar-focus uppercase tracking-wider text-accent-700/80">
                      MIN
                    </span>
                    <span className="text-xl sm:text-2xl font-axis-sng-indlab-value text-fantas-900">
                      {townWeather.minTemp}
                    </span>
                  </div>

                  {/* Maximum Temp */}
                  <div className="flex flex-row justify-center items-center gap-1.5 sm:gap-2 tracking-wider">
                    <span className="text-xl sm:text-2xl font-axis-sng-indlab-value text-fantas-900">
                      {townWeather.maxTemp}
                    </span>
                    <span className="text-xs sm:text-[14px] font-axis-navbar-focus uppercase tracking-wider text-flamengo-600/80">
                      MAX
                    </span>
                  </div>
                </div>

                {/* 4. Bottom Highlight Band */}
                <div className="bg-fantas-200/50 border-t border-gray-500/80 py-2.5 px-1 grid grid-cols-3 divide-x divide-gray-500/80 items-center text-center text-[10px] font-axis-bold text-slate-700 uppercase tracking-wider">
                  {/* Chance of Rain */}
                  <div className="flex flex-col items-center justify-center px-0.5 sm:px-1" title="Chance of Rain">
                    <span className='font-axis-navbar-focus uppercase text-[9px] text-gray-700/70'>
                      Chance of rain
                    </span>
                    <div className='flex flex-row items-center justify-center gap-1 px-0.5 sm:px-1'>
                      {getIcon('streamline-ultimate:rain-umbrella-1-bold', 'h-3 w-3 text-gray-700/70')}
                      <span className="text-fantas-900 font-axis-navbar-focus text-[12px] sm:text-[14px]">{townWeather.rainChance}</span>
                    </div>
                  </div>

                  {/* Wind / Gust */}
                  <div className="flex flex-col items-center justify-center px-0.5 sm:px-1" title="Wind / Gust">
                    <span className='font-axis-navbar-focus uppercase text-[9px] text-gray-700/70'>
                      Wind / Gust
                    </span>
                    <div className='flex flex-row items-center justify-center gap-1 px-0.5 sm:px-1'>
                      {/* Updated icon to a wind icon instead of umbrella */}
                      {getIcon('ph:wind-bold', 'h-3 w-3 text-gray-700/70')}
                      <span className="text-fantas-900 font-axis-navbar-focus text-[12px] sm:text-[14px] whitespace-nowrap">{townWeather.winds}</span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="flex flex-col items-center justify-center px-0.5 sm:px-1" title="Humidity">
                    <span className='font-axis-navbar-focus uppercase text-[9px] text-gray-700/70'>
                      Humidity
                    </span>
                    <div className='flex flex-row items-center justify-center gap-1 px-0.5 sm:px-1'>
                      {getIcon('material-symbols:humidity-percentage-outline', 'h-3 w-3 text-gray-700/70')}
                      {/* Changed text-[12px] sm:text-[14px] -> text-[14px] sm:text-[16px] */}
                      <span className="text-fantas-900 font-axis-navbar-focus text-[12px] sm:text-[14px]">{townWeather.humidity}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 3️⃣ COLUMN 3 (RIGHT): Statistics */}
          <div className="flex flex-col justify-start h-full gap-4 lg:border-l lg:border-stone-200 lg:pl-8 pt-6 lg:pt-0 border-t border-stone-200 lg:border-t-0">
            <div className="flex justify-center items-center gap-2 text-md font-axis-navbar-focus uppercase tracking-widest text-fantas-900">
              {getIcon('lucide:bar-chart-3', 'h-4 w-4')}
              <span>Municipal Impact & Stats</span>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4 sm:gap-6 pt-1">
              {statsData.map((stat, idx) => (
                <div key={idx} className="flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    {getIcon(stat.icon, 'h-4 w-4 text-fantas-900/60')}
                    <span className="text-2xl sm:text-2xl md:text-3xl font-axis-sng-indlab-value text-fantas-900 proportional-nums tracking-[0.035em]">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-fantas-900/60 font-axis-medium leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
