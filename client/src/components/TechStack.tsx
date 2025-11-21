import { Card } from "@/components/ui/card";
import { SiReact, SiVite, SiTailwindcss, SiTypescript } from "react-icons/si";

const technologies = [
  {
    name: "React",
    icon: SiReact,
    description: "A JavaScript library for building user interfaces with component-based architecture",
    color: "text-[#61DAFB]",
  },
  {
    name: "Vite",
    icon: SiVite,
    description: "Next generation frontend tooling with lightning-fast HMR and optimized builds",
    color: "text-[#646CFF]",
  },
  {
    name: "Tailwind CSS",
    icon: SiTailwindcss,
    description: "Utility-first CSS framework for rapidly building custom user interfaces",
    color: "text-[#06B6D4]",
  },
  {
    name: "TypeScript",
    icon: SiTypescript,
    description: "Typed superset of JavaScript that compiles to plain JavaScript for safer code",
    color: "text-[#3178C6]",
  },
];

export function TechStack() {
  return (
    <section id="tech" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-heading text-3xl font-semibold md:text-4xl" data-testid="text-tech-title">
            Powered By Modern Tech
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground" data-testid="text-tech-subtitle">
            Built with industry-leading tools and frameworks
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {technologies.map((tech, index) => (
            <Card
              key={tech.name}
              className="flex flex-col items-center p-8 text-center hover-elevate"
              data-testid={`card-tech-${index}`}
            >
              <tech.icon className={`mb-4 h-16 w-16 ${tech.color}`} />
              <h3 className="mb-2 text-xl font-semibold" data-testid={`text-tech-name-${index}`}>
                {tech.name}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`text-tech-description-${index}`}>
                {tech.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
