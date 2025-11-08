import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { INDUSTRY_CONFIGS } from "@/lib/dashboard/industry-config";
import { ArrowRight, Briefcase } from "lucide-react";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";

export const metadata = {
  title: "Solutions by Industry | Perpetual Core",
  description: "Tailored AI solutions for professionals across 12+ industries",
};

export default function SolutionsPage() {
  // Map solution URLs
  const solutionUrls: { [key: string]: string } = {
    "law-firm": "/solutions/law-firms",
    healthcare: "/solutions/healthcare",
    sales: "/solutions/sales",
    "real-estate": "/solutions/real-estate",
    agency: "/solutions/agencies",
    accounting: "/solutions/accountants",
    church: "/solutions/churches",
    consulting: "/solutions/consulting",
    "financial-advisor": "/solutions/financial-advisors",
    "it-services": "/solutions/it-services",
    "non-profit": "/solutions/non-profits",
    education: "/solutions/education",
  };

  // All industries
  const allIndustries = Object.keys(INDUSTRY_CONFIGS)
    .filter(key => key !== 'personal')
    .map(key => ({
      key,
      ...INDUSTRY_CONFIGS[key],
      url: solutionUrls[key] || `/solutions/${key}`,
    }));

  // Gradient mapping
  const gradients: { [key: string]: string } = {
    "law-firm": "from-blue-600 to-cyan-600",
    healthcare: "from-emerald-600 to-green-600",
    sales: "from-purple-600 to-pink-600",
    "real-estate": "from-orange-600 to-amber-600",
    "non-profit": "from-rose-600 to-pink-600",
    education: "from-amber-600 to-orange-600",
    agency: "from-indigo-600 to-purple-600",
    accounting: "from-blue-600 to-indigo-600",
    church: "from-violet-600 to-purple-600",
    consulting: "from-cyan-600 to-blue-600",
    "financial-advisor": "from-green-600 to-emerald-600",
    "it-services": "from-sky-600 to-blue-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <header className="border-b backdrop-blur-2xl bg-card/80 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              AI
            </div>
            <span className="text-lg sm:text-xl font-bold">Perpetual Core</span>
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
            <Button asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <PublicMobileNav />
            <Button size="sm" asChild className="h-9 shadow-md active:scale-95 transition-all">
              <Link href="/signup">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 border-2 border-primary/30 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-xl">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold">12+ Industry Solutions</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-tight mb-6 sm:mb-8 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent leading-tight px-4">
            Built for Your Industry
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Tailored AI solutions designed specifically for professionals who need institutional memory and expertise preservation
          </p>

          <Button size="lg" asChild className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto shadow-2xl hover:shadow-3xl transition-all active:scale-95 touch-manipulation">
            <Link href="/signup">
              Start Free Trial <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* All Industries Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allIndustries.map((industry) => {
              const Icon = industry.icon;
              const gradient = gradients[industry.key] || "from-blue-600 to-purple-600";

              return (
                <Link key={industry.key} href={industry.url} className="group relative block">
                  {/* Gradient glow on hover */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`} />

                  <Card className="relative h-full backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden">
                    <CardContent className="p-8">
                      {/* Icon with gradient background */}
                      <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <Icon className="h-10 w-10 text-white" />
                      </div>

                      {/* Industry name */}
                      <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                        {industry.name}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {industry.subheadline}
                      </p>

                      {/* Arrow indicator */}
                      <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                        Learn more <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-purple-600 text-primary-foreground border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Transform Your Work?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join professionals who are preserving their expertise and accelerating their work
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-lg px-8 shadow-xl hover:shadow-2xl transition-shadow">
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10 shadow-xl hover:shadow-2xl transition-all"
              >
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
      <footer className="border-t backdrop-blur-2xl bg-card/80 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  AI
                </div>
                <span className="text-lg font-bold">Perpetual Core</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your intelligent productivity platform powered by cutting-edge AI
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-primary transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition">Pricing</Link></li>
                <li><Link href="/solutions" className="hover:text-primary transition">Solutions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition">About</Link></li>
                <li><Link href="#" className="hover:text-primary transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-primary transition">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition">Privacy</Link></li>
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
