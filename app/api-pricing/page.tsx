"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Zap,
  Shield,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Layers,
  Lock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function APIPricingPage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  const apiTiers = [
    {
      name: "Free",
      price: 0,
      description: "Perfect for testing and personal projects",
      features: [
        "1,000 API calls/month",
        "Basic AI models",
        "Community support",
        "Rate limit: 10 req/min",
        "Standard documentation",
      ],
      cta: "Start Free",
      popular: false,
      payPerCall: "$0.01/call over limit",
    },
    {
      name: "Hobby",
      price: billingInterval === "monthly" ? 29 : 290,
      description: "For side projects and small applications",
      features: [
        "25,000 API calls/month",
        "All AI models",
        "Email support",
        "Rate limit: 60 req/min",
        "Advanced documentation",
        "Usage analytics",
      ],
      cta: "Start Hobby",
      popular: false,
      payPerCall: "$0.005/call over limit",
    },
    {
      name: "Pro",
      price: billingInterval === "monthly" ? 99 : 990,
      description: "For production applications and growing businesses",
      features: [
        "100,000 API calls/month",
        "All AI models + premium",
        "Priority support",
        "Rate limit: 300 req/min",
        "Advanced analytics",
        "Custom webhooks",
        "99.9% SLA",
      ],
      cta: "Start Pro",
      popular: true,
      payPerCall: "$0.003/call over limit",
    },
    {
      name: "Scale",
      price: billingInterval === "monthly" ? 299 : 2990,
      description: "For high-volume applications and enterprises",
      features: [
        "500,000 API calls/month",
        "All models + fine-tuned",
        "24/7 dedicated support",
        "Rate limit: 1000 req/min",
        "Real-time analytics",
        "Custom integrations",
        "99.95% SLA",
        "Multi-region deployment",
      ],
      cta: "Start Scale",
      popular: false,
      payPerCall: "$0.001/call over limit",
    },
    {
      name: "Enterprise",
      price: null,
      description: "For mission-critical applications at scale",
      features: [
        "Unlimited API calls",
        "Custom AI model training",
        "White-glove support",
        "Custom rate limits",
        "Dedicated infrastructure",
        "Custom SLA up to 99.99%",
        "On-premise deployment option",
        "Custom contract terms",
      ],
      cta: "Contact Sales",
      popular: false,
      payPerCall: "Custom pricing",
    },
  ];

  const payPerCallPricing = [
    {
      model: "GPT-4 Turbo",
      input: "$0.01 / 1K tokens",
      output: "$0.03 / 1K tokens",
      description: "Most capable model for complex tasks",
    },
    {
      model: "Claude 3 Sonnet",
      input: "$0.003 / 1K tokens",
      output: "$0.015 / 1K tokens",
      description: "Best balance of intelligence and speed",
    },
    {
      model: "GPT-3.5 Turbo",
      input: "$0.0005 / 1K tokens",
      output: "$0.0015 / 1K tokens",
      description: "Fast and cost-effective",
    },
    {
      model: "Text Embeddings",
      input: "$0.0001 / 1K tokens",
      output: "N/A",
      description: "Semantic search and similarity",
    },
  ];

  const useCases = [
    {
      icon: <Code className="h-6 w-6" />,
      title: "SaaS Applications",
      description: "Power your product with AI capabilities through our API",
      examples: "Chatbots, content generation, data analysis",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Automation Workflows",
      description: "Integrate AI into your existing automation pipelines",
      examples: "Document processing, email classification, sentiment analysis",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Insights",
      description: "Extract insights from unstructured data at scale",
      examples: "Customer feedback analysis, trend detection, forecasting",
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Custom Integrations",
      description: "Build custom solutions tailored to your business",
      examples: "CRM integrations, custom agents, workflow automation",
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
            <span className="text-xl font-bold">Perpetual Core API</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs/api" className="text-sm font-medium hover:underline">
              Documentation
            </Link>
            <Link href="/developers" className="text-sm font-medium hover:underline">
              Developer Portal
            </Link>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Badge className="mb-4" variant="secondary">
              <Code className="mr-2 h-3 w-3" />
              Developer API
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Build AI-Powered Applications
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Access enterprise-grade AI models through a simple, scalable API.
              Pay only for what you use, with transparent pricing and no hidden fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/developers">
                  Get API Key
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs/api">
                  View Docs
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Toggle */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-4 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingInterval === "monthly"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("annual")}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingInterval === "annual"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <Badge variant="secondary" className="ml-2">Save 17%</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-16">
          {apiTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular ? "border-primary border-2 shadow-lg" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="shadow-lg">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{tier.description}</CardDescription>
                <div className="pt-4">
                  {tier.price === null ? (
                    <div className="text-3xl font-bold">Custom</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">
                        ${tier.price}
                        {tier.price > 0 && (
                          <span className="text-lg font-normal text-muted-foreground">
                            /{billingInterval === "monthly" ? "mo" : "yr"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tier.payPerCall}
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={tier.name === "Enterprise" ? "/contact-sales" : "/developers"}>
                    {tier.cta}
                  </Link>
                </Button>
                <div className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pay-Per-Call Pricing */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pay-Per-Call Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Transparent, usage-based pricing for AI model access
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {payPerCallPricing.map((model) => (
                    <div
                      key={model.model}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-semibold">{model.model}</div>
                        <div className="text-sm text-muted-foreground">{model.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Input: {model.input}</div>
                        {model.output !== "N/A" && (
                          <div className="text-sm font-medium">Output: {model.output}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for Developers</h2>
            <p className="text-lg text-muted-foreground">
              Power any application with our flexible API
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.title}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {useCase.icon}
                  </div>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <strong>Examples:</strong> {useCase.examples}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Shield className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">
                  SOC 2 Type II certified with end-to-end encryption
                </p>
              </div>
              <div>
                <TrendingUp className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Scalable Infrastructure</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-scaling to handle any traffic volume
                </p>
              </div>
              <div>
                <Lock className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Rate Limiting</h3>
                <p className="text-sm text-muted-foreground">
                  Protect your API with built-in rate limiting
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get your API key and start building in minutes. No credit card required for free tier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/developers">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact-sales">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
