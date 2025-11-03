"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function PartnerApplicationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    partner_name: "",
    partner_email: "",
    partner_type: "individual",
    company_name: "",
    website: "",
    audience_size: "",
    audience_description: "",
    referral_strategy: "",
    expected_monthly_referrals: "",
    why_partner: "",
    agree_terms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agree_terms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      toast.success("Application submitted successfully!");
      router.push("/partners/application-success");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/partners" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-xl font-bold">Back to Partner Program</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Apply to Partner Program</h1>
            <p className="text-muted-foreground">
              Join 1,200+ partners earning up to 30% recurring commission. Application takes 3-5 minutes.
            </p>
          </div>

          {/* Benefits Reminder */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">20-30% Commission</div>
                    <div className="text-muted-foreground">Recurring for 12-36 months</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Instant Approval</div>
                    <div className="text-muted-foreground">Get approved within 24 hours</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Marketing Support</div>
                    <div className="text-muted-foreground">Assets & training provided</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="partner_name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="partner_name"
                    placeholder="John Doe"
                    value={formData.partner_name}
                    onChange={(e) => handleInputChange("partner_name", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="partner_email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="partner_email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.partner_email}
                    onChange={(e) => handleInputChange("partner_email", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="partner_type">
                    Partner Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.partner_type}
                    onValueChange={(value) => handleInputChange("partner_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual (Influencer/Blogger)</SelectItem>
                      <SelectItem value="agency">Agency/Consultant</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.partner_type !== "individual" && (
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      placeholder="Acme Inc."
                      value={formData.company_name}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="website">Website / Social Media URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audience Information */}
            <Card>
              <CardHeader>
                <CardTitle>Audience & Reach</CardTitle>
                <CardDescription>Tell us about your audience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="audience_size">
                    Audience Size <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.audience_size}
                    onValueChange={(value) => handleInputChange("audience_size", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1000">0 - 1,000</SelectItem>
                      <SelectItem value="1000-5000">1,000 - 5,000</SelectItem>
                      <SelectItem value="5000-10000">5,000 - 10,000</SelectItem>
                      <SelectItem value="10000-50000">10,000 - 50,000</SelectItem>
                      <SelectItem value="50000+">50,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience_description">
                    Audience Description <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="audience_description"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Describe your audience: demographics, interests, industries, etc."
                    value={formData.audience_description}
                    onChange={(e) => handleInputChange("audience_description", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="referral_strategy">
                    Referral Strategy <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="referral_strategy"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="How do you plan to promote Perpetual Core? (blog posts, social media, email list, client referrals, etc.)"
                    value={formData.referral_strategy}
                    onChange={(e) => handleInputChange("referral_strategy", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="expected_monthly_referrals">
                    Expected Monthly Referrals
                  </Label>
                  <Select
                    value={formData.expected_monthly_referrals}
                    onValueChange={(value) => handleInputChange("expected_monthly_referrals", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expected referrals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1 - 5 per month</SelectItem>
                      <SelectItem value="5-10">5 - 10 per month</SelectItem>
                      <SelectItem value="10-25">10 - 25 per month</SelectItem>
                      <SelectItem value="25+">25+ per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Why Partner With Us?</CardTitle>
                <CardDescription>Help us understand your motivation</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="why_partner">
                    Why do you want to become a partner? <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="why_partner"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Tell us why you're interested in partnering with Perpetual Core and what makes you a good fit"
                    value={formData.why_partner}
                    onChange={(e) => handleInputChange("why_partner", e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Terms & Submit */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agree_terms"
                    checked={formData.agree_terms}
                    onChange={(e) => handleInputChange("agree_terms", e.target.checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="agree_terms" className="cursor-pointer">
                    I agree to the{" "}
                    <Link href="/partners/terms" className="text-primary hover:underline">
                      Partner Program Terms & Conditions
                    </Link>{" "}
                    and understand the commission structure
                  </Label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/partners")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Applications are typically reviewed within 24 hours. You'll receive an email with next steps.
                </p>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
