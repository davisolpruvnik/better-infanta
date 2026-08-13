import ServicesSection from '../components/home/ServicesSection';
import GovernmentActivitySection from '../components/home/GovernmentActivitySection';
import SEO from '../components/SEO';
import LandingSite from '../components/home/Landing';

const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="BetterInfanta.org"
        description="A one-stop location for accessing services and government resources of Infanta, Quezon."
        keywords="government, local government, services, public services, civic services"
      />
      <main className="flex-grow">
        <LandingSite />
        <ServicesSection />
        <GovernmentActivitySection />
      </main>
    </>
  );
};

export default Home;
