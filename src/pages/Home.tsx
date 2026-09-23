import ServicesSection from '../components/home/ServicesSection';
import GovernmentActivitySection from '../components/home/GovernmentActivitySection';
import SEO from '../components/SEO';
import LandingSite from '../components/home/Landing';
import WeatherCardDetail from '@/components/home/DetailedWeather';
import TideCard from '@/components/home/DetailedTide';

const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="Better Infanta"
        description="A one-stop location for accessing services and government resources of Infanta, Quezon."
        keywords="government, local government, services, public services, civic services"
      />
      <main className="flex-grow">
        <LandingSite />
        <ServicesSection />
        <GovernmentActivitySection />
        <div className="container mx-auto px-4 py-8">
              {/* Pair Weather + Editorial Tide Table */}
              <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6">
                <div className="flex-1 bg-white">
                  <WeatherCardDetail />
                </div>
                <div className="flex shrink-0">
                  <TideCard />
                </div>
              </div>
            </div>
      </main>
    </>
  );
};

export default Home;
