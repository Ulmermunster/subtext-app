import { Card } from "@/components/ui/card";
import { Zap, Package, Palette, Code2, Rocket, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast HMR",
    description: "Instant hot module replacement keeps your development flow uninterrupted with lightning-fast updates.",
  },
  {
    icon: Package,
    title: "Optimized Build",
    description: "Production-ready builds with automatic code splitting and tree-shaking for optimal performance.",
  },
  {
    icon: Palette,
    title: "Tailwind CSS",
    description: "Utility-first CSS framework with dark mode support and a comprehensive component library.",
  },
  {
    icon: Code2,
    title: "TypeScript Ready",
    description: "Full TypeScript support out of the box for type-safe development and better IDE integration.",
  },
  {
    icon: Rocket,
    title: "Modern Tooling",
    description: "Built on Vite for next-generation frontend tooling with native ES modules support.",
  },
  {
    icon: Shield,
    title: "Production Ready",
    description: "Battle-tested configuration with best practices for building scalable React applications.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-heading text-3xl font-semibold md:text-4xl" data-testid="text-features-title">
            Everything You Need
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground" data-testid="text-features-subtitle">
            A complete development environment with modern tools and best practices
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="p-8 hover-elevate"
              data-testid={`card-feature-${index}`}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold" data-testid={`text-feature-title-${index}`}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground" data-testid={`text-feature-description-${index}`}>
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
