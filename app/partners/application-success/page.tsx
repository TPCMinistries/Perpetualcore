"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Mail, Clock, TrendingUp } from "lucide-react";

export default function PartnerApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold">
            Perpetual Core
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Application Submitted!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for applying to our Partner Program
            </p>
          </div>

          {/* What Happens Next */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
              <CardDescription>Here's what to expect in the coming days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Confirmation Email</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll receive a confirmation email within the next few minutes with your application details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Application Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Our team will review your application within 24 hours. We'll evaluate your audience fit and partnership potential.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Get Started</h3>
                  <p className="text-sm text-muted-foreground">
                    Once approved, you'll receive your unique referral link and access to the partner dashboard with marketing materials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earning Potential */}
          <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Your Earning Potential</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">20%</div>
                  <div className="text-muted-foreground">Starting commission</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12 mo</div>
                  <div className="text-muted-foreground">Recurring duration</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">$600</div>
                  <div className="text-muted-foreground">Per Pro plan referral</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Example: Refer 10 Pro plan customers = $6,000 in first year recurring commissions
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link href="/partners">Back to Partner Program</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Questions? Email us at{" "}
            <a href="mailto:partners@aios.com" className="text-primary hover:underline">
              partners@aios.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
