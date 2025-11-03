"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Zap,
  Check,
  X,
  TrendingUp,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Crown,
  Building2,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChangePlanDialog } from "@/components/billing/change-plan-dialog";

interface Subscription {
  id: string;
  plan: "free" | "pro" | "business" | "enterprise";
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
}

interface Usage {
  ai_messages_count: number;
  documents_stored: number;
  storage_bytes: number;
  emails_synced: number;
  whatsapp_messages: number;
  calendar_events: number;
}

interface PlanLimits {
  ai_messages_per_month: number;
  documents_limit: number;
  storage_gb: number;
  team_members_limit: number;
  advanced_ai: boolean;
  priority_support: boolean;
  custom_integrations: boolean;
  sso_enabled: boolean;
}

const PLAN_INFO = {
  free: {
    name: "Free",
    price: 0,
    icon: Sparkles,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
  pro: {
    name: "Pro",
    price: 49,
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  business: {
    name: "Business",
    price: 149,
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  enterprise: {
    name: "Enterprise",
    price: 499,
    icon: Building2,
    color: "text-gray-800",
    bgColor: "bg-gray-100",
  },
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [changePlanDialog, setChangePlanDialog] = useState<{
    open: boolean;
    targetPlan: string;
  }>({ open: false, targetPlan: "" });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      // Fetch subscription
      const subRes = await fetch("/api/stripe/subscription");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      // Fetch usage
      const usageRes = await fetch("/api/stripe/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData.usage);
      }

      // Fetch limits
      const limitsRes = await fetch("/api/stripe/limits");
      if (limitsRes.ok) {
        const limitsData = await limitsRes.json();
        setLimits(limitsData.limits);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: "pro" | "business") => {
    try {
      setUpgrading(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: billingInterval }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Failed to start upgrade process");
    } finally {
      setUpgrading(false);
    }
  };

  const handleChangePlan = (targetPlan: string) => {
    setChangePlanDialog({ open: true, targetPlan });
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to open billing portal");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open billing portal");
    }
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2);
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getPriceDisplay = (plan: keyof typeof PLAN_INFO) => {
    if (plan === "free") return "$0";
    if (plan === "enterprise") return "Starting at $499";

    const planInfo = PLAN_INFO[plan];
    if (billingInterval === "annual") {
      const annualPrice =
        plan === "pro" ? 470 :
        plan === "business" ? 1430 : planInfo.price;
      const monthlyEquivalent = (annualPrice / 12).toFixed(0);
      return `$${monthlyEquivalent}/mo`;
    }
    return `$${planInfo.price}/mo`;
  };

  const getAnnualSavings = (plan: "pro" | "business") => {
    const prices = {
      pro: { monthly: 49, annual: 470 },
      business: { monthly: 149, annual: 1430 },
    };
    const annualizedMonthly = prices[plan].monthly * 12;
    return annualizedMonthly - prices[plan].annual;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const PlanIcon = PLAN_INFO[currentPlan].icon;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing & Usage</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and view usage statistics
        </p>
      </div>

      {/* Current Plan */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-lg ${PLAN_INFO[currentPlan].bgColor}`}
              >
                <PlanIcon
                  className={`h-6 w-6 ${PLAN_INFO[currentPlan].color}`}
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {PLAN_INFO[currentPlan].name} Plan
                </h3>
                <p className="text-gray-600 mt-1">
                  {getPriceDisplay(currentPlan)}
                </p>

                {subscription?.trial_end && (
                  <div className="flex items-center gap-2 mt-3 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-900">
                    <Calendar className="h-4 w-4" />
                    Trial ends{" "}
                    {new Date(subscription.trial_end).toLocaleDateString()}
                  </div>
                )}

                {subscription?.cancel_at_period_end && (
                  <div className="flex items-center gap-2 mt-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-yellow-900">
                    <AlertCircle className="h-4 w-4" />
                    Cancels on{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}
                  </div>
                )}

                {subscription?.status === "active" &&
                  !subscription.cancel_at_period_end &&
                  subscription.current_period_end && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Renews{" "}
                      {new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()}
                    </div>
                  )}
              </div>
            </div>

            <div className="flex gap-2">
              {currentPlan === "free" && (
                <>
                  <Button
                    onClick={() => handleUpgrade("pro")}
                    disabled={upgrading}
                  >
                    {upgrading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Upgrade to Pro
                  </Button>
                </>
              )}
              {(currentPlan === "pro" || currentPlan === "business" || currentPlan === "enterprise") && (
                <>
                  <Button onClick={() => handleChangePlan("free")} variant="outline">
                    Downgrade to Free
                  </Button>
                  <Button onClick={handleManageBilling} variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Billing
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* AI Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This month</span>
                <span className="font-medium">
                  {usage?.ai_messages_count || 0}
                  {limits?.ai_messages_per_month === -1
                    ? " / Unlimited"
                    : ` / ${limits?.ai_messages_per_month || 0}`}
                </span>
              </div>
              {limits?.ai_messages_per_month !== -1 && (
                <Progress
                  value={getUsagePercentage(
                    usage?.ai_messages_count || 0,
                    limits?.ai_messages_per_month || 0
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stored</span>
                <span className="font-medium">
                  {usage?.documents_stored || 0}
                  {limits?.documents_limit === -1
                    ? " / Unlimited"
                    : ` / ${limits?.documents_limit || 0}`}
                </span>
              </div>
              {limits?.documents_limit !== -1 && (
                <Progress
                  value={getUsagePercentage(
                    usage?.documents_stored || 0,
                    limits?.documents_limit || 0
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">
                  {formatBytes(usage?.storage_bytes || 0)} GB / {limits?.storage_gb || 0} GB
                </span>
              </div>
              <Progress
                value={getUsagePercentage(
                  parseFloat(formatBytes(usage?.storage_bytes || 0)),
                  limits?.storage_gb || 1
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Emails synced</span>
                <span className="font-medium">{usage?.emails_synced || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">WhatsApp messages</span>
                <span className="font-medium">{usage?.whatsapp_messages || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Calendar events</span>
                <span className="font-medium">{usage?.calendar_events || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              billingInterval === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("annual")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              billingInterval === "annual"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600"
            }`}
          >
            Annual
            <span className="ml-2 text-xs text-green-600 font-semibold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Free</h3>
                <div className="text-3xl font-bold mt-2">$0</div>
                <div className="text-sm text-gray-600">forever</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">50 AI messages/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Gemini model only</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">5 documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">1 GB storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Advanced AI models</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Email & Calendar</span>
                </li>
              </ul>
              {currentPlan === "free" && (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              )}
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-600 rounded-lg p-6 relative">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                Popular
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold">Pro</h3>
                <div className="text-3xl font-bold mt-2">{getPriceDisplay("pro")}</div>
                <div className="text-sm text-gray-600">
                  {billingInterval === "annual" && `$${getAnnualSavings("pro")} saved/year`}
                  {billingInterval === "monthly" && "per month"}
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">1,000 AI messages/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">All AI models (GPT-4, Claude, Gemini)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">$0.05 per message overage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">10 GB storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Email & Calendar integration</span>
                </li>
              </ul>
              {currentPlan === "pro" ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : currentPlan === "free" ? (
                <Button
                  onClick={() => handleUpgrade("pro")}
                  disabled={upgrading}
                  className="w-full"
                >
                  Upgrade to Pro
                </Button>
              ) : (
                <Button
                  onClick={() => handleChangePlan("pro")}
                  className="w-full"
                >
                  Change to Pro
                </Button>
              )}
            </div>

            {/* Business Plan */}
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Business</h3>
                <div className="text-3xl font-bold mt-2">{getPriceDisplay("business")}</div>
                <div className="text-sm text-gray-600">
                  {billingInterval === "annual" && `$${getAnnualSavings("business")} saved/year`}
                  {billingInterval === "monthly" && "per month"}
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">4,000 AI messages/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">$0.04 per message overage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">50 GB storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Team collaboration (5 users)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              {currentPlan === "business" ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : currentPlan === "free" ? (
                <Button
                  onClick={() => handleUpgrade("business")}
                  disabled={upgrading}
                  className="w-full"
                >
                  Upgrade to Business
                </Button>
              ) : (
                <Button
                  onClick={() => handleChangePlan("business")}
                  className="w-full"
                >
                  Change to Business
                </Button>
              )}
            </div>

            {/* Enterprise Plan */}
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Enterprise</h3>
                <div className="text-3xl font-bold mt-2">{getPriceDisplay("enterprise")}</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">20,000+ AI messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">$0.03 per message overage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Everything in Business</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">SOC 2, HIPAA compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Dedicated success manager</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      <ChangePlanDialog
        open={changePlanDialog.open}
        onOpenChange={(open) => setChangePlanDialog({ ...changePlanDialog, open })}
        currentPlan={currentPlan}
        targetPlan={changePlanDialog.targetPlan}
        interval={billingInterval === "annual" ? "yearly" : "monthly"}
        onSuccess={fetchBillingData}
      />
    </div>
  );
}
