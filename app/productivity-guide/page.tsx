"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Loader2,
  ArrowRight,
  Users,
  Star,
  AlertCircle,
} from "lucide-react";

export default function ProductivityGuidePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "lead-magnet",
          leadMagnet: "ai-productivity-guide",
        }),
      });

      if (!response.ok) throw new Error("Failed to submit");

      setSubmitted(true);
      toast.success("Success! Check your email for the download link.");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Check Your Email!
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              We've sent your <strong>AI Productivity Guide</strong> to{" "}
              <strong>{formData.email}</strong>
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 text-left">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-3">
                What happens next:
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Download your 65-page guide and start implementing today</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Get actionable AI tips delivered over the next 6 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Access free templates, prompts, and ROI calculators</span>
                </li>
              </ul>
            </div>
            <Button
              size="lg"
              className="mt-8 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
              onClick={() => window.location.href = "/"}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Alert Bar */}
        <div className="mb-8 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-center">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              Are you still spending 15+ hours a week on tasks AI could do in minutes? Download this guide now.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight text-slate-900 dark:text-slate-100">
            Stop Wasting Time on Tasks<br />
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              AI Can Do in Seconds
            </span>
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto font-medium mb-8">
            The 65-page blueprint showing you exactly how businesses are saving{" "}
            <span className="text-purple-600 dark:text-purple-400 font-bold">$84,000 per employee</span> with AI automation
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Join thousands of businesses
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                Rated 4.9/5
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Pain Points & Benefits */}
          <div className="space-y-8">
            {/* Pain Section */}
            <div className="bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
                Are You Struggling With...
              </h2>
              <ul className="space-y-3">
                {[
                  "Spending hours on email responses that feel like copy-paste?",
                  "Drowning in repetitive data entry and report creation?",
                  "Content creation taking days instead of hours?",
                  "Your team working overtime on tasks machines could handle?",
                  "Competitors moving faster because they're already using AI?",
                ].map((pain, i) => (
                  <li key={i} className="flex items-start gap-3 text-purple-900 dark:text-purple-100">
                    <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">✗</span>
                    <span className="text-sm font-medium">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution Section */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Inside This Free Guide:
              </h2>

              <div className="space-y-4">
                {[
                  {
                    icon: Zap,
                    title: "20+ Copy-Paste Prompts",
                    description: "Ready-to-use prompts for email, content, analysis, and more",
                    gradient: "from-yellow-400 to-orange-500"
                  },
                  {
                    icon: TrendingUp,
                    title: "Real Case Studies",
                    description: "How companies saved 20+ hours/week with specific AI strategies",
                    gradient: "from-green-400 to-emerald-500"
                  },
                  {
                    icon: Clock,
                    title: "30-Day Implementation Roadmap",
                    description: "Step-by-step plan to transform your workflow in one month",
                    gradient: "from-blue-400 to-cyan-500"
                  },
                  {
                    icon: Download,
                    title: "ROI Calculator & Templates",
                    description: "Measure your time savings and calculate exact ROI",
                    gradient: "from-purple-400 to-pink-500"
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="group flex gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 text-center">
                What You'll Achieve:
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "20+", label: "Hours Saved/Week" },
                  { value: "$84K", label: "Avg. Savings/Year" },
                  { value: "65", label: "Pages of Value" },
                  { value: "100%", label: "Free Forever" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-8">
            <Card className="shadow-2xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50 dark:from-slate-900 dark:to-purple-950">
              <CardContent className="p-8">
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg mb-4">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Get Your Free Guide
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Instant download. No credit card required.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        required
                        className="h-12"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="h-12"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="h-12"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="h-12"
                      placeholder="Your Company"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full h-16 text-lg bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02] font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Sending to your inbox...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-6 w-6" />
                        Get Instant Access Now
                        <ArrowRight className="ml-2 h-6 w-6" />
                      </>
                    )}
                  </Button>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>100% Free - No Credit Card</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Instant Email Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Unsubscribe Anytime</span>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-500 dark:text-slate-500 pt-2">
                    By downloading, you'll receive our AI productivity tips. Unsubscribe anytime with one click.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Trust Badge */}
            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold mb-2">Trusted by teams at:</p>
              <p className="text-xs">Startups • Agencies • Fortune 500s • Consultancies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
