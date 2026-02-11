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
  Receipt,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChangePlanDialog } from "@/components/billing/change-plan-dialog";

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  invoiceUrl: string | null;
  invoicePdf: string | null;
  paid: boolean;
}

interface Subscription {
  id: string;
  plan: "free" | "starter" | "pro" | "team" | "business" | "enterprise";
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

const PLAN_INFO: Record<string, {
  name: string;
  price: number;
  annualPrice: number;
  icon: typeof Sparkles;
  color: string;
  bgColor: string;
}> = {
  free: {
    name: "Free",
    price: 0,
    annualPrice: 0,
    icon: Sparkles,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
  starter: {
    name: "Starter",
    price: 49,
    annualPrice: 470,
    icon: Zap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  pro: {
    name: "Pro",
    price: 99,
    annualPrice: 950,
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  team: {
    name: "Team",
    price: 499,
    annualPrice: 4790,
    icon: Users,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  business: {
    name: "Business",
    price: 1999,
    annualPrice: 19190,
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  enterprise: {
    name: "Enterprise",
    price: 9999,
    annualPrice: 95990,
    icon: Building2,
    color: "text-gray-800",
    bgColor: "bg-gray-100",
  },
};

function PlanCard({
  plan,
  name,
  price,
  subtitle,
  features,
  popular,
  currentPlan,
  onUpgrade,
  onChangePlan,
  upgrading,
}: {
  plan: string;
  name: string;
  price: string;
  subtitle: string;
  features: { included: boolean; text: string }[];
  popular?: boolean;
  currentPlan: string;
  onUpgrade: (plan: string) => void;
  onChangePlan: (plan: string) => void;
  upgrading: boolean;
}) {
  const isCurrent = currentPlan === plan;
  const isDowngrade = getOrderIndex(plan) < getOrderIndex(currentPlan);
  const isUpgrade = getOrderIndex(plan) > getOrderIndex(currentPlan);

  return (
    <div className={`border${popular ? "-2 border-blue-600" : ""} rounded-lg p-6 relative`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
          Popular
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-xl font-bold">{name}</h3>
        <div className="text-3xl font-bold mt-2">{price}</div>
        <div className="text-sm text-gray-600">{subtitle}</div>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2">
            {f.included ? (
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            )}
            <span className={`text-sm ${f.included ? "" : "text-gray-600"}`}>{f.text}</span>
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <Button disabled className="w-full">Current Plan</Button>
      ) : currentPlan === "free" && isUpgrade ? (
        <Button onClick={() => onUpgrade(plan)} disabled={upgrading} className="w-full">
          {upgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Upgrade to {name}
        </Button>
      ) : isDowngrade ? (
        <Button onClick={() => onChangePlan(plan)} variant="outline" className="w-full">
          Downgrade to {name}
        </Button>
      ) : (
        <Button onClick={() => onChangePlan(plan)} className="w-full">
          {isUpgrade ? `Upgrade to ${name}` : `Switch to ${name}`}
        </Button>
      )}
    </div>
  );
}

const PLAN_ORDER = ["free", "starter", "pro", "team", "business", "enterprise"];
function getOrderIndex(plan: string) {
  return PLAN_ORDER.indexOf(plan);
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

      // Fetch invoices
      const invoiceRes = await fetch("/api/stripe/invoices");
      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        setInvoices(invoiceData.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
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
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch {
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

  const getPriceDisplay = (plan: string) => {
    const info = PLAN_INFO[plan];
    if (!info || plan === "free") return "$0";
    if (plan === "enterprise") return "Custom";

    if (billingInterval === "annual") {
      const monthlyEquivalent = Math.round(info.annualPrice / 12);
      return `$${monthlyEquivalent}/mo`;
    }
    return `$${info.price}/mo`;
  };

  const getAnnualSavings = (plan: string) => {
    const info = PLAN_INFO[plan];
    if (!info || !info.annualPrice) return 0;
    return (info.price * 12) - info.annualPrice;
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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                <Button
                  onClick={() => handleUpgrade("starter")}
                  disabled={upgrading}
                >
                  {upgrading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Upgrade
                </Button>
              )}
              {currentPlan !== "free" && (
                <>
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

      {/* Invoice History */}
      {invoices.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-600">Invoice</th>
                    <th className="pb-3 font-medium text-gray-600">Date</th>
                    <th className="pb-3 font-medium text-gray-600">Amount</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                    <th className="pb-3 font-medium text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs">
                        {invoice.number || invoice.id.slice(-8)}
                      </td>
                      <td className="py-3 text-gray-600">
                        {new Date(invoice.created * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: invoice.currency.toUpperCase(),
                        }).format(invoice.amount / 100)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            invoice.paid
                              ? "bg-green-100 text-green-700"
                              : invoice.status === "open"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {invoice.paid ? "Paid" : invoice.status || "Unknown"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.invoiceUrl && (
                            <a
                              href={invoice.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-700"
                              title="View invoice"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {invoice.invoicePdf && (
                            <a
                              href={invoice.invoicePdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-700"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Free Plan */}
            <PlanCard
              plan="free"
              name="Free"
              price="$0"
              subtitle="forever"
              features={[
                { included: true, text: "Unlimited Gemini messages" },
                { included: true, text: "5 documents" },
                { included: true, text: "1 GB storage" },
                { included: false, text: "Advanced AI models" },
                { included: false, text: "Email & Calendar" },
                { included: false, text: "Workflows" },
              ]}
              currentPlan={currentPlan}
              onUpgrade={handleUpgrade}
              onChangePlan={handleChangePlan}
              upgrading={upgrading}
            />

            {/* Starter Plan */}
            <PlanCard
              plan="starter"
              name="Starter"
              price={getPriceDisplay("starter")}
              subtitle={billingInterval === "annual" ? `$${getAnnualSavings("starter")} saved/year` : "per month"}
              features={[
                { included: true, text: "Unlimited GPT-4o Mini" },
                { included: true, text: "100 premium model messages" },
                { included: true, text: "Unlimited documents" },
                { included: true, text: "10 GB storage" },
                { included: true, text: "Email & Calendar" },
                { included: true, text: "Workflows" },
              ]}
              currentPlan={currentPlan}
              onUpgrade={handleUpgrade}
              onChangePlan={handleChangePlan}
              upgrading={upgrading}
            />

            {/* Pro Plan */}
            <PlanCard
              plan="pro"
              name="Pro"
              price={getPriceDisplay("pro")}
              subtitle={billingInterval === "annual" ? `$${getAnnualSavings("pro")} saved/year` : "per month"}
              popular
              features={[
                { included: true, text: "Unlimited all AI models" },
                { included: true, text: "50 GB storage" },
                { included: true, text: "API access" },
                { included: true, text: "25 custom skills" },
                { included: true, text: "Priority support (4hr)" },
                { included: false, text: "Team collaboration" },
              ]}
              currentPlan={currentPlan}
              onUpgrade={handleUpgrade}
              onChangePlan={handleChangePlan}
              upgrading={upgrading}
            />

            {/* Team Plan */}
            <PlanCard
              plan="team"
              name="Team"
              price={getPriceDisplay("team")}
              subtitle={billingInterval === "annual" ? `$${getAnnualSavings("team")} saved/year` : "per month"}
              features={[
                { included: true, text: "Everything in Pro" },
                { included: true, text: "Up to 10 team members" },
                { included: true, text: "Unlimited storage" },
                { included: true, text: "Slack integration" },
                { included: true, text: "Unlimited custom skills" },
                { included: true, text: "Dedicated success manager" },
              ]}
              currentPlan={currentPlan}
              onUpgrade={handleUpgrade}
              onChangePlan={handleChangePlan}
              upgrading={upgrading}
            />

            {/* Business Plan */}
            <PlanCard
              plan="business"
              name="Business"
              price={getPriceDisplay("business")}
              subtitle={billingInterval === "annual" ? `$${getAnnualSavings("business")} saved/year` : "per month"}
              features={[
                { included: true, text: "Everything in Team" },
                { included: true, text: "Up to 50 team members" },
                { included: true, text: "SSO & custom training" },
                { included: true, text: "WhatsApp integration" },
                { included: true, text: "99.9% SLA" },
                { included: true, text: "Priority phone support (2hr)" },
              ]}
              currentPlan={currentPlan}
              onUpgrade={handleUpgrade}
              onChangePlan={handleChangePlan}
              upgrading={upgrading}
            />

            {/* Enterprise Plan */}
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Enterprise</h3>
                <div className="text-3xl font-bold mt-2">Custom</div>
                <div className="text-sm text-gray-600">contact sales</div>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "Everything in Business",
                  "250+ team members",
                  "White-label & on-premise",
                  "SOC 2, HIPAA compliance",
                  "99.95% SLA",
                  "24/7 dedicated support",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{text}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" asChild>
                <a href="mailto:enterprise@perpetualcore.com">Contact Sales</a>
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
