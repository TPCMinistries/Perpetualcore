"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { signIn, signInWithMagicLink } from "@/lib/auth/actions";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function safeNext(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/api/") || value.startsWith("/auth/callback")) return null;
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkState, setMagicLinkState] = useState<"idle" | "sending" | "sent">("idle");

  async function onMagicLink() {
    setError(null);
    const email = form.getValues("email");
    const valid = await form.trigger("email");
    if (!valid || !email) {
      setError("Enter your email above first, then request a sign-in link.");
      return;
    }
    setMagicLinkState("sending");
    try {
      const requestedNext =
        safeNext(searchParams.get("next")) ?? safeNext(searchParams.get("redirect"));
      const result = await signInWithMagicLink(email, requestedNext ?? undefined);
      if (result.error) {
        setError(result.error);
        setMagicLinkState("idle");
        return;
      }
      setMagicLinkState("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setMagicLinkState("idle");
    }
  }

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInInput) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(values);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Preserve product-specific auth intent first. The RFP marketing site
      // links to /login?next=/orgs/new, including local /rfp development
      // where the hostname is plain localhost rather than rfp.*.
      const requestedNext =
        safeNext(searchParams.get("next")) ?? safeNext(searchParams.get("redirect"));

      // Host-aware fallback. rfp.perpetualcore.com → /orgs (resolves to the
      // user's first org's discovery feed). Other hosts keep the legacy
      // /dashboard SaaS landing.
      const isRfpHost =
        typeof window !== "undefined" &&
        /^rfp\.(perpetualcore\.com|localhost)/i.test(window.location.host);
      router.push(requestedNext ?? (isRfpHost ? "/orgs" : "/dashboard"));
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
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        {magicLinkState === "sent" ? (
          <div className="rounded-md bg-primary/10 p-3 text-sm">
            Check your email — a one-time sign-in link is on its way. It signs
            you in without a password.
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading || magicLinkState === "sending"}
            onClick={onMagicLink}
          >
            {magicLinkState === "sending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              "Email me a sign-in link instead"
            )}
          </Button>
        )}
      </form>
    </Form>
  );
}
