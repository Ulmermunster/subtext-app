import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-card py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl" data-testid="text-cta-title">
          Ready to Start Building?
        </h2>
        <p className="mb-8 text-lg text-muted-foreground" data-testid="text-cta-description">
          Get started with this template and experience the power of modern React development with Vite
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" data-testid="button-cta-start">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" data-testid="button-cta-docs">
            <BookOpen className="mr-2 h-5 w-5" />
            Read Documentation
          </Button>
        </div>
      </div>
    </section>
  );
}
