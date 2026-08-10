import ServicesSection from '../components/home/ServicesSection';
import GovernmentActivitySection from '../components/home/GovernmentActivitySection';
import SEO from '../components/SEO';
import LandingSite from '../components/home/Landing';
import TownStats from '@/components/home/StatGeneralSinMaps';

const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="Home"
        description="Official website of your local government. Access government services, information, and resources."
        keywords="government, local government, services, public services, civic services"
      />
      <main className="flex-grow">
        <LandingSite />
        <ServicesSection />
        <GovernmentActivitySection />
        <TownStats />
      </main>
    </>
  );
};

export default Home;
