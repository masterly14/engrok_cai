import CTASection from "./_components/ctaSection";
import FeaturesSection from "./_components/featuresSection";
import Footer from "./_components/footer";
import Header from "./_components/header";
import HeroSection from "./_components/heroSection";
import IndustriesSection from "./_components/industriesSection";
import PricingSection from "./_components/pricingSection";
import StatsSection from "./_components/statsSection";
import TestimonialsSection from "./_components/testimonialSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <IndustriesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
