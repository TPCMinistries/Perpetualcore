"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HandshakeIcon,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Gift,
  Target,
  Zap,
} from "lucide-react";

export default function PartnersPage() {
  const tiers = [
    {
      name: "Affiliate",
      commission: "20%",
      description: "Perfect for influencers, bloggers, and content creators",
      requirements: "Anyone can join",
      benefits: [
        "20% recurring commission on all referrals",
        "Commission paid for 12 months",
        "Custom referral link and tracking",
        "Marketing materials provided",
        "Monthly payouts via Stripe",
        "Real-time dashboard",
      ],
      payoutExample: "$50 starter plan → $10/month × 12 = $120 per customer",
    },
    {
      name: "Partner",
      commission: "25%",
      description: "For consultants, agencies, and resellers",
      requirements: "5+ active referrals/month",
      benefits: [
        "25% recurring commission on all referrals",
        "Commission paid for 24 months",
        "Priority support for your clients",
        "Co-marketing opportunities",
        "Partner badge and listing",
        "Quarterly business reviews",
        "Early access to new features",
      ],
      payoutExample: "$99 pro plan → $24.75/month × 24 = $594 per customer",
      popular: true,
    },
    {
      name: "Enterprise Partner",
      commission: "30%",
      description: "For established businesses driving enterprise sales",
      requirements: "10+ enterprise referrals or $50K+ ARR",
      benefits: [
        "30% recurring commission on all referrals",
        "Commission paid for 36 months",
        "Dedicated partner manager",
        "Joint sales calls and presentations",
        "White-label options available",
        "Custom deal structuring",
        "Exclusive training and certification",
        "Quarterly revenue sharing bonuses",
      ],
      payoutExample: "$500 business plan → $150/month × 36 = $5,400 per customer",
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Apply to Join",
      description: "Fill out a quick application form and get approved within 24 hours",
    },
    {
      step: 2,
      title: "Get Your Links",
      description: "Access your unique referral links and marketing materials",
    },
    {
      step: 3,
      title: "Share & Promote",
      description: "Share with your audience through your channels",
    },
    {
      step: 4,
      title: "Earn Commissions",
      description: "Get paid monthly for every customer you refer",
    },
  ];

  const stats = [
    {
      icon: <DollarSign className="h-6 w-6" />,
      value: "$2.1M",
      label: "Paid to Partners",
    },
    {
      icon: <Users className="h-6 w-6" />,
      value: "1,200+",
      label: "Active Partners",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      value: "$4,500",
      label: "Avg Monthly Earning",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      value: "92%",
      label: "Partner Satisfaction",
    },
  ];

  const resources = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Marketing Materials",
      description: "Pre-built assets including banners, emails, and social media posts",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Training & Support",
      description: "Comprehensive training materials and dedicated partner support",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-Time Analytics",
      description: "Track clicks, conversions, and commissions in your partner dashboard",
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: "Bonus Incentives",
      description: "Earn extra bonuses for hitting monthly and quarterly milestones",
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
            <span className="text-xl font-bold">Partner Program</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/partners/login" className="text-sm font-medium hover:underline">
              Partner Login
            </Link>
            <Button asChild>
              <Link href="/partners/apply">Apply Now</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Badge className="mb-4" variant="secondary">
              <HandshakeIcon className="mr-2 h-3 w-3" />
              Partner & Affiliate Program
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Earn Up to 30% Recurring Revenue
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join 1,200+ partners earning passive income by referring customers to Perpetual Core.
              Get paid for 12-36 months per customer with industry-leading commissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/partners/apply">
                  Apply to Partner Program
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#tiers">View Commission Tiers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Tiers */}
      <section id="tiers" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Commission Tiers</h2>
            <p className="text-lg text-muted-foreground">
              Earn more as you grow with our tiered commission structure
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
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
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-4">
                    <div className="text-4xl font-bold text-primary">{tier.commission}</div>
                    <div className="text-sm text-muted-foreground mt-1">recurring commission</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <strong>Requirements:</strong> {tier.requirements}
                  </div>
                  <div className="space-y-2">
                    {tier.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      <strong>Example:</strong> {tier.payoutExample}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/partners/apply">Apply for {tier.name}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((phase) => (
                <div key={phase.step} className="text-center">
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                    {phase.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{phase.title}</h3>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Partner Resources</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to succeed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource) => (
              <Card key={resource.title}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {resource.icon}
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Partner Success Stories</h2>
            <p className="text-lg text-muted-foreground">
              Hear from our top-earning partners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                role: "AI Consultant",
                earnings: "$12K/month",
                quote: "The recurring commission structure means I earn $12K every month from clients I referred last year. It's completely changed my business.",
              },
              {
                name: "Michael Chen",
                role: "Tech Blogger",
                earnings: "$8K/month",
                quote: "I write about AI tools for my audience. The partner program has become my biggest revenue stream with minimal effort.",
              },
              {
                name: "Lisa Martinez",
                role: "Digital Agency Owner",
                earnings: "$25K/month",
                quote: "We recommend Perpetual Core to all our clients. The partner program generates more recurring revenue than some of our service offerings.",
              },
            ].map((story) => (
              <Card key={story.name}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <CardTitle className="text-lg">{story.name}</CardTitle>
                      <CardDescription>{story.role}</CardDescription>
                    </div>
                    <Badge variant="secondary">{story.earnings}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">"{story.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join 1,200+ partners building passive income streams. Application takes 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/partners/apply">
                  Apply Now - It's Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/partners/login">Partner Login</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No fees • Instant approval • Start earning today
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
