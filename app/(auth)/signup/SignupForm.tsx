"use client";

import { useState } from "react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasBetaCode, setHasBetaCode] = useState(false);

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
    setIsLoading(true);
    setError(null);
    setExistingEmail(null);
    setSuccessMessage(null);

    try {
      const result = await signUp(values);

      if (result.error) {
        setError(result.error);
        if ("userExists" in result && result.userExists && "email" in result) {
          setExistingEmail(result.email as string);
        }
        return;
      }

      if (result.requiresConfirmation) {
        setSuccessMessage(
          result.message || "Please check your email to confirm your account before signing in."
        );
        return;
      }

      // Host-aware landing — rfp.* → /orgs, otherwise legacy /dashboard.
      const isRfpHost =
        typeof window !== "undefined" &&
        /^rfp\.(perpetualcore\.com|localhost)/i.test(window.location.host);
      router.push(isRfpHost ? "/orgs" : "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={isLoading} />
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
                  placeholder="john@example.com"
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
                  <Input placeholder="Acme Inc" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {existingEmail ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Looks like you already have an account.</p>
            <p className="mt-1 text-amber-800">
              {existingEmail} is registered. Sign in instead, or reset your
              password if you don&apos;t remember it.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/login?email=${encodeURIComponent(existingEmail)}`}
                className="inline-flex items-center justify-center rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-950"
              >
                Sign in →
              </Link>
              <Link
                href={`/login?reset=1&email=${encodeURIComponent(existingEmail)}`}
                className="inline-flex items-center justify-center rounded-md border border-amber-400 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
              >
                Reset password
              </Link>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {successMessage && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
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
  );
}
