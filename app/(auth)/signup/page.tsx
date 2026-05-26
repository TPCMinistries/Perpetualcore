"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signUp } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

const PLAN_SUMMARY: Record<string, { name: string; price: string; description: string; bullets: string[] }> = {
  free: {
    name: "Free",
    price: "$0/month",
    description: "Start with the core workspace and personal knowledge base.",
    bullets: ["Personal AI workspace", "Knowledge base", "5 documents"],
  },
  starter: {
    name: "Starter",
    price: "$49/month",
    description: "For individuals and operators who want the Engine as a daily tool.",
    bullets: ["Unlimited knowledge base", "Email and calendar integration", "Priority email support"],
  },
  pro: {
    name: "Pro",
    price: "$99/month",
    description: "For power users who need automations, API access, and premium models.",
    bullets: ["Premium models", "Advanced workflows", "API access"],
  },
  teams: {
    name: "Teams",
    price: "Custom",
    description: "For teams that need shared context, controls, and operating memory.",
    bullets: ["Shared knowledge base", "RBAC and audit logs", "Volume pricing"],
  },
  team: {
    name: "Teams",
    price: "Custom",
    description: "For teams that need shared context, controls, and operating memory.",
    bullets: ["Shared knowledge base", "RBAC and audit logs", "Volume pricing"],
  },
};

function SignUpShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create your workspace</CardTitle>
          <CardDescription className="text-center">
            Loading your selected plan...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpShell />}>
      <SignUpPageContent />
    </Suspense>
  );
}

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [hasBetaCode, setHasBetaCode] = useState(false);
  const selectedPlanId = (searchParams.get("plan") || "free").toLowerCase();
  const selectedInterval = searchParams.get("interval") === "annual" ? "annual" : "monthly";
  const selectedPlan = PLAN_SUMMARY[selectedPlanId] || PLAN_SUMMARY.free;

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      organizationName: "",
      betaCode: "",
    },
  });

  async function onSubmit(values: SignUpInput) {
    console.log("[SignUp] Form submitted with values:", values);
    console.log("[SignUp] Form errors:", form.formState.errors);

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await signUp(values);
      console.log("[SignUp] Sign up result:", result);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Check if email confirmation is required
      if (result.requiresConfirmation) {
        setSuccessMessage(
          result.message || "Please check your email to confirm your account before signing in."
        );
        return;
      }

      if (!["free", "teams", "team"].includes(selectedPlanId)) {
        const checkout = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selectedPlanId, interval: selectedInterval }),
        });

        if (checkout.ok) {
          const { url } = await checkout.json();
          if (url) {
            window.location.href = url;
            return;
          }
        }

        router.push(`/dashboard/settings/billing?plan=${selectedPlanId}`);
        router.refresh();
        return;
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("[SignUp] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create your workspace
          </CardTitle>
          <CardDescription className="text-center">
            Enter your details to start using Perpetual Core with your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{selectedPlan.name} plan</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedPlan.description}</p>
              </div>
              <p className="text-sm font-bold whitespace-nowrap">{selectedPlan.price}</p>
            </div>
            <ul className="mt-3 space-y-2">
              {selectedPlan.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {bullet}
                </li>
              ))}
            </ul>
            {selectedPlanId !== "free" && selectedPlanId !== "teams" && selectedPlanId !== "team" && (
              <p className="mt-3 text-xs text-muted-foreground">
                After account creation, you will continue to secure checkout.
              </p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Alex Carter"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="alex@company.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="betaCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beta Invite Code (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="BETA-XXXX-XXXX"
                        {...field}
                        disabled={isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          setHasBetaCode(!!e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!hasBetaCode && (
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Company or organization name"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Debug: Show validation errors */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {error?.message as string}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                  {successMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
