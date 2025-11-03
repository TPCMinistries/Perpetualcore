"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Rocket,
  Wrench,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Clock,
  Target,
  Sparkles,
  Building,
  Zap,
} from "lucide-react";

export default function ProfessionalServicesPage() {
  const servicePackages = [
    {
      name: "Quick Start",
      price: "$5,000",
      duration: "2 weeks",
      icon: <Rocket className="h-6 w-6" />,
      description: "Get up and running fast with expert guidance",
      includes: [
        "Initial platform setup and configuration",
        "Up to 3 AI agents deployed",
        "Basic workflow automation",
        "Team onboarding (up to 10 users)",
        "Documentation and best practices",
        "2 weeks of post-launch support",
      ],
      ideal: "Small teams ready to launch quickly",
    },
    {
      name: "Full Implementation",
      price: "$25,000",
      duration: "6-8 weeks",
      icon: <Building className="h-6 w-6" />,
      description: "Comprehensive deployment tailored to your business",
      includes: [
        "Complete platform configuration",
        "10-15 custom AI agents",
        "Advanced workflow automation",
        "Integration with existing systems",
        "Custom reporting and analytics",
        "Team training for up to 50 users",
        "30 days of post-launch support",
        "Dedicated success manager",
      ],
      ideal: "Mid-size companies seeking full deployment",
      popular: true,
    },
    {
      name: "Enterprise Transformation",
      price: "$75,000+",
      duration: "3-6 months",
      icon: <Sparkles className="h-6 w-6" />,
      description: "Complete AI transformation for large organizations",
      includes: [
        "Full-scale enterprise deployment",
        "Unlimited custom AI agents",
        "Enterprise workflow automation",
        "Multi-system integrations (CRM, ERP, etc.)",
        "Advanced security and compliance setup",
        "Custom model training and fine-tuning",
        "Company-wide training program",
        "90 days of white-glove support",
        "Dedicated implementation team",
        "Executive strategy sessions",
      ],
      ideal: "Large enterprises with complex needs",
    },
  ];

  const additionalServices = [
    {
      name: "Training Sessions",
      price: "$2,000 - $10,000",
      icon: <GraduationCap className="h-6 w-6" />,
      description: "Customized training for your team",
      options: [
        "Half-day workshop: $2,000 (up to 20 people)",
        "Full-day intensive: $4,000 (up to 30 people)",
        "Multi-day training program: $10,000 (up to 50 people)",
        "Virtual or on-site delivery",
        "Customized curriculum",
        "Training materials included",
      ],
    },
    {
      name: "Custom Agent Development",
      price: "$10,000 - $100,000",
      icon: <Wrench className="h-6 w-6" />,
      description: "Bespoke AI agents built for your unique needs",
      options: [
        "Simple agent: $10,000 - $25,000",
        "Complex agent with integrations: $25,000 - $50,000",
        "Enterprise agent platform: $50,000 - $100,000+",
        "Includes design, development, testing",
        "Full documentation",
        "Training and knowledge transfer",
      ],
    },
    {
      name: "Strategic Consultation",
      price: "$500 - $5,000/hour",
      icon: <Target className="h-6 w-6" />,
      description: "Expert guidance on AI strategy and implementation",
      options: [
        "1-hour consultation: $500",
        "Half-day strategy session: $2,500",
        "Full-day executive workshop: $5,000",
        "AI readiness assessment",
        "Technology roadmap planning",
        "ROI analysis and business case",
      ],
    },
  ];

  const process = [
    {
      step: 1,
      title: "Discovery Call",
      description: "We discuss your needs, challenges, and goals in a free 30-minute consultation",
      duration: "30 minutes",
    },
    {
      step: 2,
      title: "Proposal & Planning",
      description: "Receive a detailed proposal with timeline, deliverables, and investment",
      duration: "1 week",
    },
    {
      step: 3,
      title: "Kickoff & Implementation",
      description: "Our team begins work with regular check-ins and progress updates",
      duration: "Varies by package",
    },
    {
      step: 4,
      title: "Launch & Support",
      description: "Go live with confidence, backed by ongoing support and training",
      duration: "Ongoing",
    },
  ];

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Faster Time to Value",
      description: "Get results in weeks, not months, with expert implementation",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Team",
      description: "Work with AI specialists who've done this hundreds of times",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Customized Solutions",
      description: "Tailored to your specific industry, processes, and goals",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Risk Mitigation",
      description: "Avoid common pitfalls with battle-tested best practices",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Professional Services</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/contact-sales">Schedule Consultation</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Badge className="mb-4" variant="secondary">
              <Users className="mr-2 h-3 w-3" />
              Expert Implementation Services
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Accelerate Your AI Transformation
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Work with our team of AI experts to implement, customize, and optimize
              your Perpetual Core deployment. From quick starts to enterprise transformations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact-sales?service=professional">
                  Schedule Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#packages">View Packages</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Professional Services?</h2>
            <p className="text-lg text-muted-foreground">
              Maximize your investment with expert guidance
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section id="packages" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Implementation Packages</h2>
            <p className="text-lg text-muted-foreground">
              Choose the package that fits your needs and timeline
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {servicePackages.map((pkg) => (
              <Card
                key={pkg.name}
                className={`relative ${
                  pkg.popular ? "border-primary border-2 shadow-lg" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="shadow-lg">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {pkg.icon}
                  </div>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className="pt-4">
                    <div className="text-3xl font-bold">{pkg.price}</div>
                    <div className="text-sm text-muted-foreground">{pkg.duration}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={`/contact-sales?service=${pkg.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      Get Started
                    </Link>
                  </Button>
                  <div className="space-y-2">
                    {pkg.includes.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      <strong>Ideal for:</strong> {pkg.ideal}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Additional Services</h2>
            <p className="text-lg text-muted-foreground">
              À la carte services to complement your implementation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {additionalServices.map((service) => (
              <Card key={service.name}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {service.icon}
                  </div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                  <div className="pt-2">
                    <div className="text-xl font-bold">{service.price}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {service.options.map((option, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/contact-sales?service=${service.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      Learn More
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Process</h2>
            <p className="text-lg text-muted-foreground">
              Simple, transparent, and results-driven
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {process.map((phase, idx) => (
                <div key={phase.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {phase.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{phase.title}</h3>
                      <Badge variant="outline">{phase.duration}</Badge>
                    </div>
                    <p className="text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Schedule a free 30-minute consultation to discuss your needs and find the right package.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact-sales?service=professional">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Consultation
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact-sales">Contact Sales Team</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No commitment required • Free consultation • Custom proposals
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
