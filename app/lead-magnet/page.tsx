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
} from "lucide-react";

export default function LeadMagnetPage() {
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
              Check Your Email! 📧
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
                  <CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>Download your guide and start implementing today</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>Get exclusive AI tips delivered to your inbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>Access free templates and tools</span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6">
            <Sparkles className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              FREE DOWNLOAD
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 tracking-tight">
            The Ultimate AI<br />Productivity Guide
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover how top-performing teams are using AI to save 20+ hours per week and 10x their output
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Inside This Guide:
            </h2>

            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  title: "AI Automation Playbook",
                  description: "Step-by-step workflows to automate your most time-consuming tasks"
                },
                {
                  icon: TrendingUp,
                  title: "ROI Calculator Template",
                  description: "Calculate exactly how much time and money AI can save your business"
                },
                {
                  icon: Clock,
                  title: "20+ Ready-to-Use Prompts",
                  description: "Copy-paste prompts for marketing, sales, support, and operations"
                },
                {
                  icon: Download,
                  title: "Implementation Checklist",
                  description: "Your 30-day roadmap to AI transformation"
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>Trusted by 10,000+ businesses</strong> including teams at Fortune 500 companies, startups, and agencies worldwide.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-8">
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Get Instant Access
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Enter your details below to download the guide
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
                    className="w-full h-14 text-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download Guide Now
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500 dark:text-slate-500">
                    By downloading, you agree to receive emails from Perpetual Core. Unsubscribe anytime.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
