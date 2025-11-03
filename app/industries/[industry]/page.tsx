import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { INDUSTRY_CONFIGS, IndustryType } from "@/lib/dashboard/industry-config";
import {
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  Star,
} from "lucide-react";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    industry: string;
  };
}

export default function IndustryPage({ params }: PageProps) {
  const industryKey = params.industry as IndustryType;
  const config = INDUSTRY_CONFIGS[industryKey];

  if (!config) {
    notFound();
  }

  const Icon = config.icon;
  const MetricIcon = config.primaryMetric.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Perpetual Core</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium hover:text-primary transition">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium hover:underline">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium">Sign In</Link>
            <Button size="sm" asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Industry Specific */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 text-primary text-sm font-medium mb-6 backdrop-blur-sm">
            <Icon className="h-4 w-4" />
            <span className="font-semibold">Built for {config.name}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            {config.headline}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {config.welcomeMessage}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 shadow-md hover:shadow-lg transition-shadow">
              <Link href="/pricing">See Pricing</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Metric Highlight */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardContent className="p-12 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MetricIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{config.primaryMetric.label}</h2>
            <p className="text-xl text-muted-foreground">
              {config.primaryMetric.description}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions - What You Can Do */}
      <section className="container mx-auto px-4 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What You Can Do
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful features designed specifically for {config.name.toLowerCase()}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {config.quickActions.map((action) => {
              const ActionIcon = action.icon;
              const gradients: { [key: string]: string } = {
                blue: "from-blue-500 to-cyan-600",
                purple: "from-purple-500 to-pink-600",
                green: "from-green-500 to-emerald-600",
                orange: "from-orange-500 to-amber-600",
                cyan: "from-cyan-500 to-blue-600",
                pink: "from-pink-500 to-rose-600",
                indigo: "from-indigo-500 to-purple-600",
                violet: "from-violet-500 to-purple-600",
                sky: "from-sky-500 to-blue-600",
                emerald: "from-emerald-500 to-green-600",
              };
              const gradient = gradients[action.color] || "from-blue-500 to-purple-600";

              return (
                <Card key={action.label} className="border-2 hover:border-primary transition-all hover:shadow-xl group">
                  <CardContent className="p-8">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                      <ActionIcon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{action.label}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Preview */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Track What Matters
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Key metrics designed for {config.name.toLowerCase()}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {config.stats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <Card key={stat.label} className="border-2 text-center">
                  <CardContent className="p-8">
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <StatIcon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{stat.label}</h3>
                    <p className="text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="container mx-auto px-4 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-4">
              <Shield className="h-4 w-4" />
              <span>Enterprise-Grade Security</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your Data Stays Yours
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              100% private and secure. Built for {config.name.toLowerCase()} who value confidentiality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "100% Private", desc: "Your data is encrypted and only accessible by you" },
              { title: "SOC 2 Compliant", desc: "Annual security audits and compliance" },
              { title: "Never Used for Training", desc: "Your data never trains AI models" },
              { title: "99.9% Uptime SLA", desc: "Always available when you need it" },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-6 rounded-xl bg-muted">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by {config.name}</h2>
            <div className="flex items-center justify-center gap-2 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
            </div>
            <p className="text-muted-foreground mt-2">Rated 5/5 by professionals like you</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-primary text-primary-foreground border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your {config.name}?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join professionals who are preserving their expertise and accelerating their work
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  AI
                </div>
                <span className="text-lg font-bold">Perpetual Core</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Built specifically for {config.name}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="/#industries" className="hover:text-primary">Industries</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">About</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 AI Operating System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Generate static params for all industries
export async function generateStaticParams() {
  return Object.keys(INDUSTRY_CONFIGS)
    .filter(key => key !== 'personal')
    .map((industry) => ({
      industry,
    }));
}
