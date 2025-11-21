import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { DemoSection } from "@/components/DemoSection";
import { TechStack } from "@/components/TechStack";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <FeaturesGrid />
        <DemoSection />
        <TechStack />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
