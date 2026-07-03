import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/hero/Hero";
import Purpose from "@/components/sections/Purpose";
import ServicesSection from "@/components/sections/ServicesSection";
import ForWhom from "@/components/sections/ForWhom";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Purpose />
        <ServicesSection />
        <ForWhom />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
