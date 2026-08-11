import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GooeyInput } from '@/components/ui/gooey-input';
import { useWeather } from '@/hooks/useWeather';
import { WEATHER_LOCATIONS } from '@/components/config/weather-config';
import { getCategorySubcategories, serviceCategories } from '@/data/yamlLoader';

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
  };

  // 💡 INTERNATIONAL STANDARD AQI COLOR MAPPING (US EPA Standards)
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'; // Good
    if (aqi <= 100) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'; // Moderate
    if (aqi <= 150) return 'bg-orange-500/20 text-orange-300 border-orange-500/40'; // Unhealthy for Sensitive Groups
    if (aqi <= 200) return 'bg-red-500/20 text-red-300 border-red-500/40'; // Unhealthy
    if (aqi <= 300) return 'bg-purple-500/20 text-purple-300 border-purple-500/40'; // Very Unhealthy
    return 'bg-rose-950/40 text-rose-300 border-rose-700/50'; // Hazardous (301+)
  };

  // Stats data
  const statsData = [
    { label: 'Barangays', value: '36', icon: 'lucide:layers' },
    { label: 'Income Class', value: '1st', icon: 'lucide:shield-check' },
    { label: 'Citizens Served', value: '77,676', icon: 'lucide:users' },
    { label: 'Area (in sq km)', value: '342.76', icon: 'lucide:file-text' },
  ];

  const getIcon = (iconName: string, className = 'h-5 w-5') => (
    <Suspense fallback={<div className={`${className} bg-white/10 rounded animate-pulse`} />}>
      <LazyIconify icon={iconName} className={className} />
    </Suspense>
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-8 sm:py-12 md:py-20">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 -left-20 w-64 sm:w-96 h-64 sm:h-96 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 flex flex-col gap-8 sm:gap-10 md:gap-14">

        {/* ========================================================= */}
        {/* 1. TOP SECTION: LOGO + BETTER INFANTA HEADER (2-PART)     */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center border-b border-white/10 pb-8 sm:pb-10">

          {/* TOP LEFT: Rounded Star Logo */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start">
            <div className="relative group flex items-center justify-center size-24 sm:size-28 md:size-36 rounded-2xl sm:rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl transition-transform duration-300 hover:scale-105">
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-accent-400/30 to-primary-300/30 blur-md group-hover:blur-lg transition-all" />
              <div className="relative z-10 flex items-center justify-center text-white">
                {getIcon('lucide:sparkles', 'h-12 w-12 sm:h-14 sm:w-14 md:h-18 md:w-18 text-accent-200 animate-pulse')}
              </div>
            </div>
          </div>

          {/* TOP RIGHT: Better Infanta Branding Block */}
          <div className="lg:col-span-9 text-center lg:text-left flex flex-col gap-2 sm:gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-axis-navbar-focus uppercase tracking-wider text-white leading-tight">
              Better Infanta
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-primary-100/90 font-axis-thin max-w-2xl leading-relaxed mx-auto lg:mx-0">
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
              <div className="flex items-center justify-center gap-2 text-md font-axis-navbar-focus uppercase tracking-widest text-accent-200">
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
                      trigger: "bg-white text-gray-900 shadow-lg border border-white/30",
                      bubbleSurface: "bg-white text-gray-900 shadow-lg border border-white/30",
                      input: "text-gray-900 placeholder:text-gray-500 font-axis-book text-xs sm:text-sm",
                    }}
                  />
                </form>

                {/* 💡 LIVE SEARCH RESULTS DROPDOWN */}
                {searchValue.trim().length > 0 && (
                  <div className="absolute left-0 mt-2 w-full max-w-xs sm:max-w-md bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200/80 py-2 z-50 divide-y divide-gray-100 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3.5 py-1.5 text-[12px] font-axis-navbar-focus text-gray-600 uppercase tracking-widest">
                      {searchResults.length} Matching Services
                    </div>

                    {searchResults.length > 0 ? (
                      searchResults.map((item, index) => (
                        <Link
                          key={`${item.slug}-${index}`}
                          to={item.slug}
                          onClick={() => setSearchValue('')}
                          className="flex items-center justify-between px-3.5 py-2.5 hover:bg-primary-50 transition-colors text-left group"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm font-axis-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-gray-500 font-axis-book">
                              {item.category}
                            </span>
                          </div>
                          {getIcon('lucide:chevron-right', 'h-4 w-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all')}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-500 font-axis-book text-center">
                        No matching services found for "{searchValue}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-sm text-primary-200/80 font-axis-subtitular-focus uppercase tracking-wider pr-1">
                Popular
              </span>
              {quickSearchTerms.map((term) => (
                <Link
                  key={term.slug || term.label}
                  to={term.slug}
                  className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-axis-subtitular-focus bg-white/10 hover:bg-white/25 border border-white/15 hover:border-white/30 text-white tracking-wide transition-all duration-200 hover:scale-105"
                >
                  {getIcon('tabler:search', 'h-3 w-3 text-white-200')}
                  <span>{term.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 2️⃣ COLUMN 2 (MIDDLE): Compact Weather Graphic */}
          <div className="flex flex-col justify-between h-full gap-3 lg:border-l lg:border-white/15 lg:pl-8 pt-6 lg:pt-0 border-t border-white/10 lg:border-t-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-md font-axis-navbar-focus uppercase tracking-widest text-accent-200">
                {getIcon('lucide:cloud-sun', 'h-4 w-4')}
                <span>Local Weather</span>
              </div>

              {/* 📺 COMPACT WEATHER CARD */}
              <div className="w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 flex flex-col rounded-2xl bg-gradient-to-b from-white/10 via-white/5 to-black/30 border-white/20 backdrop-blur-md overflow-hidden">

                {/* 1. Town Name & Dynamically Color-Coded AQI Badge */}
                <div className="py-2.5 px-3 sm:px-4 text-center flex items-center justify-center gap-2.5">
                  <h3 className="text-xs sm:text-sm md:text-base font-axis-subtitular-focus uppercase tracking-wider text-white">
                    {townWeather.name}
                  </h3>
                  <span className={`px-2 py-0.5 text-[10px] sm:text-[12px] font-axis-navbar-focus rounded-full border tracking-wider transition-colors duration-300 ${getAqiColor(townWeather.aqi)}`}>
                    AQI {townWeather.aqi}
                  </span>
                </div>

                {/* Dotted Divider */}
                <div className="w-full border-b border-dotted border-white/20" />

                {/* 2. Temperature Beside Icon & Condition */}
                <div className="py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-center gap-2.5 sm:gap-3 text-center">
                  {getIcon(townWeather.icon, 'h-8 w-8 sm:h-9 sm:w-9 text-accent-200 shrink-0 drop-shadow-md')}
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-3xl sm:text-4xl font-axis-sng-indlab-value text-white leading-none tracking-wider">
                      {townWeather.temp}
                    </span>
                    <span className="text-[10px] sm:text-xs font-axis-navbar-focus uppercase tracking-wider text-accent-200/80">
                      FEELS LIKE
                    </span>
                    <span className="text-base sm:text-lg font-axis-sng-indlab-value text-white/80 tracking-wider">
                      {townWeather.feelsLike}
                    </span>
                  </div>
                </div>

                {/* Dotted Divider */}
                <div className="w-full border-b border-dotted border-white/20" />

                {/* 3. Minimum | Maximum Columns */}
                <div className="py-2.5 px-2 grid grid-cols-2 text-center divide-x divide-white/10">
                  {/* Minimum Temp */}
                  <div className="flex flex-row justify-center items-center gap-1.5 sm:gap-2 tracking-wider">
                    <span className="text-xs sm:text-[14px] font-axis-navbar-focus uppercase tracking-wider text-blue-300">
                      MIN
                    </span>
                    <span className="text-xl sm:text-2xl font-axis-sng-indlab-value text-white">
                      {townWeather.minTemp}
                    </span>
                  </div>

                  {/* Maximum Temp */}
                  <div className="flex flex-row justify-center items-center gap-1.5 sm:gap-2 tracking-wider">
                    <span className="text-xl sm:text-2xl font-axis-sng-indlab-value text-white">
                      {townWeather.maxTemp}
                    </span>
                    <span className="text-xs sm:text-[14px] font-axis-navbar-focus uppercase tracking-wider text-orange-400">
                      MAX
                    </span>
                  </div>
                </div>

                {/* 4. Bottom Highlight Band */}
                <div className="bg-black/40 border-t border-white/15 py-2.5 px-1 grid grid-cols-3 divide-x divide-white/20 items-center text-center text-[10px] font-axis-bold text-white uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1 px-0.5 sm:px-1" title="Chance of Rain">
                    {getIcon('mingcute:rain-line', 'h-4 w-4 text-primary-200')}
                    <span className="text-white-200 font-axis-navbar-focus text-[13px] sm:text-[15px]">{townWeather.rainChance}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1 px-0.5 sm:px-1" title="Wind & Gusts">
                    {getIcon('tabler:wind', 'h-4 w-4 text-primary-200')}
                    <span className="text-white font-axis-navbar-focus text-[12px] sm:text-[14px]">{townWeather.winds}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1 px-0.5 sm:px-1" title="Humidity">
                    {getIcon('fluent:weather-humidity-24-filled', 'h-4 w-4 text-primary-200')}
                    <span className="text-white font-axis-navbar-focus text-[13px] sm:text-[15px]">{townWeather.humidity}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 3️⃣ COLUMN 3 (RIGHT): Uncarded Statistics */}
          <div className="flex flex-col justify-start h-full gap-4 lg:border-l lg:border-white/15 lg:pl-8 pt-6 lg:pt-0 border-t border-white/10 lg:border-t-0">
            <div className="flex justify-center items-center gap-2 text-md font-axis-navbar-focus uppercase tracking-widest text-accent-200">
              {getIcon('lucide:bar-chart-3', 'h-4 w-4')}
              <span>Municipal Impact & Stats</span>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4 sm:gap-6 pt-1">
              {statsData.map((stat, idx) => (
                <div key={idx} className="flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    {getIcon(stat.icon, 'h-4 w-4 text-accent-200')}
                    <span className="text-2xl sm:text-2xl md:text-3xl font-axis-sng-indlab-value text-white proportional-nums tracking-wide">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-primary-200/80 font-axis-medium leading-tight">
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
