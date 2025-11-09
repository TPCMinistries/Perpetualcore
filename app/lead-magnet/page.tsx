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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg mb-6 animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-bold">
              FREE DOWNLOAD - LIMITED TIME
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            The Ultimate AI<br />Productivity Guide
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto font-medium">
            Discover how top-performing teams are using AI to save <span className="text-purple-600 font-bold">20+ hours per week</span> and <span className="text-blue-600 font-bold">10x their output</span>
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
                  description: "Step-by-step workflows to automate your most time-consuming tasks",
                  gradient: "from-yellow-400 to-orange-500"
                },
                {
                  icon: TrendingUp,
                  title: "ROI Calculator Template",
                  description: "Calculate exactly how much time and money AI can save your business",
                  gradient: "from-green-400 to-emerald-500"
                },
                {
                  icon: Clock,
                  title: "20+ Ready-to-Use Prompts",
                  description: "Copy-paste prompts for marketing, sales, support, and operations",
                  gradient: "from-blue-400 to-cyan-500"
                },
                {
                  icon: Download,
                  title: "Implementation Checklist",
                  description: "Your 30-day roadmap to AI transformation",
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

            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>Trusted by 10,000+ businesses</strong> including teams at Fortune 500 companies, startups, and agencies worldwide.
              </p>
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
                    Get Instant Access
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Join 10,000+ professionals already using AI
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
                        Get My Free Guide Now
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
