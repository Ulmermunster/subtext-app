import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/modern_developer_workspace_hero.png";

export function Hero() {
  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden md:min-h-[80vh]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 text-center md:py-20">
        <h1 className="mb-6 font-heading text-4xl font-bold text-white md:text-6xl" data-testid="text-hero-title">
          Build Faster with React + Vite
        </h1>
        <p className="mb-8 text-lg text-white/90 md:text-xl" data-testid="text-hero-subtitle">
          Experience lightning-fast development with instant HMR, modern tooling, and a component-driven architecture
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
            data-testid="button-hero-start"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white backdrop-blur-md hover:bg-white/10"
            data-testid="button-hero-docs"
          >
            View Documentation
          </Button>
        </div>
      </div>
    </section>
  );
}
