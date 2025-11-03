import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/auth/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExecutiveMetrics } from "@/components/premium/ExecutiveMetrics";
import { AccountManager } from "@/components/premium/AccountManager";
import { AIInsights } from "@/components/premium/AIInsights";
import { Crown, Shield, Zap } from "lucide-react";

export default async function PremiumDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile();

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-8 md:p-12 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                  Premium Executive Dashboard
                </h1>
                <p className="text-white/90 text-lg">
                  Welcome back, {profile?.full_name || "Executive"}
                </p>
              </div>
            </div>

            <Badge className="bg-white text-primary hover:bg-white/90 text-base px-6 py-3 font-semibold">
              <Crown className="mr-2 h-5 w-5" />
              $10,000/month Tier
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Security</p>
                  <p className="font-semibold text-lg">SOC 2 Compliant</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Support</p>
                  <p className="font-semibold text-lg">15-min Response</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Infrastructure</p>
                  <p className="font-semibold text-lg">Dedicated</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/80 max-w-3xl text-sm">
            This enterprise dashboard provides real-time analytics, AI-powered insights, and dedicated account management.
            Your data is processed on dedicated infrastructure with enhanced security and compliance features.
          </p>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Account Manager */}
      <AccountManager />

      {/* AI Insights */}
      <div>
        <h2 className="text-2xl font-bold mb-4">AI-Powered Insights</h2>
        <AIInsights />
      </div>

      {/* Executive Metrics */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Executive Metrics & Analytics</h2>
        <ExecutiveMetrics />
      </div>

      {/* Additional Premium Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Advanced Security</h3>
                <p className="text-sm text-muted-foreground">Enterprise-grade protection</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Dedicated infrastructure with isolated compute
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                SOC 2 Type II & ISO 27001 certified
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Real-time threat monitoring & prevention
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Encrypted at rest and in transit (AES-256)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Custom data retention and deletion policies
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Custom Integrations</h3>
                <p className="text-sm text-muted-foreground">Tailored to your workflow</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Custom API endpoints and webhooks
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Integration with your existing tools
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                White-label options with custom branding
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Dedicated engineering support for setup
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Priority feature development requests
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Premium Support */}
      <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Assistance?</h3>
              <p className="text-muted-foreground mb-4">
                Your dedicated account manager is available during business hours with guaranteed 15-minute response times.
                For emergencies, 24/7 support is just a call away.
              </p>
              <div className="flex gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">Available Now</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Direct line: +1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
