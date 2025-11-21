import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export function DemoSection() {
  const [count, setCount] = useState(0);
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data: any) => {
    console.log("Form submitted:", data);
    toast({
      title: "Form Submitted!",
      description: `Welcome, ${data.name}! We've received your message.`,
    });
    reset();
  };

  return (
    <section id="components" className="bg-card py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-heading text-3xl font-semibold md:text-4xl" data-testid="text-demo-title">
            Interactive Components
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground" data-testid="text-demo-subtitle">
            See React's reactive state management in action with live examples
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-8">
            <h3 className="mb-6 text-xl font-semibold" data-testid="text-counter-title">
              State Management Demo
            </h3>
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="mb-2 text-sm text-muted-foreground">Current Count</p>
                <p className="font-heading text-6xl font-bold text-primary" data-testid="text-counter-value">
                  {count}
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCount(count - 1)}
                  data-testid="button-decrement"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setCount(0)}
                  data-testid="button-reset"
                >
                  Reset
                </Button>
                <Button
                  size="lg"
                  onClick={() => setCount(count + 1)}
                  data-testid="button-increment"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="mb-6 text-xl font-semibold" data-testid="text-form-title">
              Form Handling
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  {...register("name", { required: true })}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email", { required: true })}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  placeholder="Your message"
                  {...register("message")}
                  data-testid="input-message"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-form">
                Submit
              </Button>
            </form>
          </Card>

          <Card className="p-8 lg:col-span-2">
            <h3 className="mb-6 text-xl font-semibold" data-testid="text-tabs-title">
              Tabbed Interface
            </h3>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="installation" data-testid="tab-installation">
                  Installation
                </TabsTrigger>
                <TabsTrigger value="usage" data-testid="tab-usage">
                  Usage
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-6" data-testid="content-overview">
                <p className="text-muted-foreground">
                  This starter template includes Vite, React, TypeScript, Tailwind CSS, and shadcn/ui
                  components. It's configured with hot module replacement for instant feedback during
                  development.
                </p>
              </TabsContent>
              <TabsContent value="installation" className="mt-6" data-testid="content-installation">
                <div className="rounded-md bg-muted p-4">
                  <code className="text-sm">npm create vite@latest my-app -- --template react-ts</code>
                </div>
              </TabsContent>
              <TabsContent value="usage" className="mt-6" data-testid="content-usage">
                <p className="text-muted-foreground">
                  Start the development server with <code className="rounded bg-muted px-1">npm run dev</code> and
                  begin building your application. Changes will be reflected instantly in your browser.
                </p>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </section>
  );
}
